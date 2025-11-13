// lib/api/encrypted-client.ts - UNIFIED ENCRYPTION
// ============================================
// SINGLE ENCRYPTION CLIENT FOR ALL LAYERS
// Transport + Chat Message Encryption
// ============================================

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import * as crypto from 'crypto';

interface UserSession {
  userId?: number;
  privateKey?: string; // Decrypted RSA private key (memory only)
  channelKeys: Map<number, string>; // channelId -> AES-256 key (hex)
}

class EncryptedApiClient {
  private client: AxiosInstance;
  private masterKey: Buffer;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;
  private readonly KEY_LENGTH = 32;
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  // ✅ CHAT E2E ENCRYPTION ADDITIONS
  private userSession: UserSession = {
    channelKeys: new Map(),
  };

  constructor() {
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';

    if (!encryptionKey || encryptionKey.length < 32) {
      console.error('⚠️ NEXT_PUBLIC_ENCRYPTION_KEY must be at least 32 characters!');
    }

    // ✅ Derive key using PBKDF2 (same as backend)
    this.masterKey = crypto.pbkdf2Sync(
      encryptionKey,
      'fluera-platform-salt', // Must match backend salt
      100000,
      this.KEY_LENGTH,
      'sha256'
    );

    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api/v1',
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // ============================================
    // REQUEST INTERCEPTOR
    // ============================================
    this.client.interceptors.request.use(
      async (config) => {
        const token = Cookies.get('accessToken');
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Set headers
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        config.headers['X-Request-ID'] = requestId;
        config.headers['X-Encryption-Enabled'] = 'true';

        // Add device fingerprint
        const deviceFingerprint = this.getDeviceFingerprint();
        if (deviceFingerprint) {
          config.headers['X-Device-Fingerprint'] = deviceFingerprint;
        }

        // Encrypt payload if exists and not empty
        if (config.data && typeof config.data === 'object' && Object.keys(config.data).length > 0) {
          try {
            const jsonString = JSON.stringify(config.data);
            const encrypted = this.encryptTransport(jsonString);
            const checksum = this.generateChecksum(encrypted);

            config.data = {
              __payload: encrypted,
              __checksum: checksum,
              __timestamp: Date.now(),
            };

            console.log(`[${requestId}] ✅ Request encrypted`);
          } catch (error) {
            console.error(`[${requestId}] ❌ Encryption failed:`, error);
            throw error;
          }
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // ============================================
    // RESPONSE INTERCEPTOR
    // ============================================
    this.client.interceptors.response.use(
      async (response) => {
        const requestId = response.config.headers?.['X-Request-ID'];

        // Decrypt encrypted responses
        if (response.data?.__payload) {
          try {
            const { __checksum, __payload } = response.data;

            // Verify checksum if present
            if (__checksum) {
              const calculatedChecksum = this.generateChecksum(__payload);
              if (calculatedChecksum !== __checksum) {
                console.error(`[${requestId}] ❌ Checksum verification failed`);
                throw new Error('Response integrity check failed');
              }
            }

            const decrypted = this.decryptTransport(__payload);
            response.data = JSON.parse(decrypted);

            console.log(`[${requestId}] ✅ Response decrypted`);
          } catch (error) {
            console.error(`[${requestId}] ❌ Decryption error:`, error);
            throw error;
          }
        }

        return response.data;
      },
      async (error) => {
        const originalRequest = error.config;
        const requestId = originalRequest?.headers?.['X-Request-ID'];

        console.error(`[${requestId}] ❌ Response error:`, error.response?.status);

        // Handle 401 - Token Expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = Cookies.get('refreshToken');
          if (!refreshToken) {
            this.handleLogout();
            return Promise.reject(error);
          }

          // Handle concurrent refresh requests
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          this.isRefreshing = true;

          try {
            const response = await this.refreshAccessToken(refreshToken);
            const { accessToken, refreshToken: newRefreshToken } = response;

            this.setTokens(accessToken, newRefreshToken);

            // Process queued requests
            this.refreshQueue.forEach((promise) => {
              promise.resolve(accessToken);
            });
            this.refreshQueue = [];

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Reject all queued requests
            this.refreshQueue.forEach((promise) => {
              promise.reject(refreshError);
            });
            this.refreshQueue = [];
            this.handleLogout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // TOKEN REFRESH
  // ============================================
  private async refreshAccessToken(refreshToken: string) {
    try {
      const requestId = `refresh-${Date.now()}`;
      console.log(`[${requestId}] 🔄 Refreshing access token...`);

      // Encrypt refresh token payload
      const payload = JSON.stringify({ refreshToken });
      const encrypted = this.encryptTransport(payload);
      const checksum = this.generateChecksum(encrypted);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          __payload: encrypted,
          __checksum: checksum,
          __timestamp: Date.now(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Encryption-Enabled': 'true',
            'X-Request-ID': requestId,
          },
          withCredentials: true,
        }
      );

      let data = response.data;

      // Decrypt if response is encrypted
      if (data?.__payload) {
        const decrypted = this.decryptTransport(data.__payload);
        data = JSON.parse(decrypted);
      }

      console.log(`[${requestId}] ✅ Token refreshed successfully`);
      return data;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  // ============================================
  // TRANSPORT ENCRYPTION (Layer 1)
  // ============================================

  /**
   * ✅ TRANSPORT: AES-256-GCM ENCRYPTION
   * For API requests/responses
   */
  private encryptTransport(text: string): string {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.masterKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encrypted (matches backend)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Transport encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * ✅ TRANSPORT: AES-256-GCM DECRYPTION
   * For API requests/responses
   */
  private decryptTransport(encryptedData: string): string {
    try {
      const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');

      if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Transport decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // ============================================
  // CHECKSUM GENERATION (must match backend)
  // ============================================
  private generateChecksum(data: string): string {
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';
    return crypto
      .createHash('sha256')
      .update(data + encryptionKey)
      .digest('hex');
  }

  // ============================================
  // CHAT MESSAGE ENCRYPTION (Layer 2) ✅ NEW
  // ============================================

  /**
   * ✅ Initialize user's E2E encryption keys after login
   * Called after successful authentication
   */
  async initializeEncryption(
    userId: number,
    encryptedPrivateKey: string,
    password: string
  ): Promise<boolean> {
    try {
      console.log(`🔐 Initializing E2E encryption for user ${userId}`);

      // Decrypt user's private key using password
      const privateKey = await this.decryptPrivateKeyWithPassword(
        encryptedPrivateKey,
        password
      );

      // Store in memory (NOT localStorage)
      this.userSession.userId = userId;
      this.userSession.privateKey = privateKey;
      this.userSession.channelKeys.clear();

      console.log(`✅ User ${userId} E2E encryption initialized`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize user encryption:', error);
      return false;
    }
  }

  /**
   * ✅ Decrypt user's private key using password
   * Backend used: crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
   */
  private async decryptPrivateKeyWithPassword(
    encryptedPrivateKeyData: string,
    password: string
  ): Promise<string> {
    try {
      // Parse format: salt:iv:authTag:encrypted
      const [saltHex, ivHex, authTagHex, encryptedHex] = encryptedPrivateKeyData.split(':');

      if (!saltHex || !ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted private key format');
      }

      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');

      // Derive key from password (MUST match backend)
      const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

      // Decrypt
      const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      const privateKey = decrypted.toString('utf8');

      // Validate it's a PEM key
      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error('Invalid private key format after decryption');
      }

      console.log('✅ Private key decrypted successfully');
      return privateKey;
    } catch (error) {
      console.error('❌ Failed to decrypt private key:', error);
      throw new Error('Failed to decrypt private key. Check password.');
    }
  }

  /**
   * ✅ Join channel with E2E encryption
   * Called when user joins a channel
   */
  async joinChannel(
    channelId: number,
    encryptedChannelKeyData: string
  ): Promise<boolean> {
    try {
      if (!this.userSession.privateKey) {
        throw new Error('User encryption not initialized');
      }

      console.log(`🔓 Decrypting channel key for channel ${channelId}`);

      // Decrypt channel key using user's private key
      const channelKey = this.decryptChannelKeyWithPrivateKey(
        encryptedChannelKeyData,
        this.userSession.privateKey
      );

      // Store in session memory
      this.userSession.channelKeys.set(channelId, channelKey);

      console.log(`✅ Joined channel ${channelId} with E2E encryption`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to join channel ${channelId}:`, error);
      return false;
    }
  }

  /**
   * ✅ Decrypt channel key using user's RSA private key
   * Format: "rsa_encrypted_key_base64:iv_hex:auth_tag_hex"
   */
  private decryptChannelKeyWithPrivateKey(
    encryptedChannelKeyData: string,
    privateKeyPEM: string
  ): string {
    try {
      const [encryptedKeyBase64, iv, authTag] = encryptedChannelKeyData.split(':');

      if (!encryptedKeyBase64) {
        throw new Error('Invalid encrypted channel key format');
      }

      const encryptedBuffer = Buffer.from(encryptedKeyBase64, 'base64');

      // Decrypt with user's private key using RSA-OAEP
      const decryptedBuffer = crypto.privateDecrypt(
        {
          key: privateKeyPEM,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer
      );

      const channelKey = decryptedBuffer.toString('hex');

      if (channelKey.length !== 64) {
        throw new Error('Invalid channel key length after decryption');
      }

      return channelKey;
    } catch (error) {
      console.error('❌ Failed to decrypt channel key:', error);
      throw new Error('Failed to decrypt channel key');
    }
  }

  /**
   * ✅ Encrypt message before sending to server (chat message)
   * Uses: Channel key (AES-256-GCM)
   */
  encryptChatMessage(channelId: number, messageContent: string): {
    encryptedContent: string;
    encryptionIv: string;
    encryptionAuthTag: string;
  } {
    try {
      const channelKey = this.userSession.channelKeys.get(channelId);
      if (!channelKey) {
        throw new Error(`Not a member of channel ${channelId}`);
      }

      const keyBuffer = Buffer.from(channelKey, 'hex');
      const iv = crypto.randomBytes(this.IV_LENGTH);

      const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);

      let encrypted = cipher.update(messageContent, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encryptedContent: encrypted,
        encryptionIv: iv.toString('hex'),
        encryptionAuthTag: authTag.toString('hex'),
      };
    } catch (error) {
      console.error('❌ Failed to encrypt chat message:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * ✅ Decrypt message received from server (chat message)
   * Uses: Channel key (AES-256-GCM)
   */
  decryptChatMessage(
    channelId: number,
    encryptedContent: string,
    encryptionIv: string,
    encryptionAuthTag: string
  ): string {
    try {
      const channelKey = this.userSession.channelKeys.get(channelId);
      if (!channelKey) {
        throw new Error(`Not a member of channel ${channelId}`);
      }

      const keyBuffer = Buffer.from(channelKey, 'hex');
      const ivBuffer = Buffer.from(encryptionIv, 'hex');
      const authTagBuffer = Buffer.from(encryptionAuthTag, 'hex');

      // Validate lengths
      if (keyBuffer.length !== 32) {
        throw new Error('Invalid channel key length');
      }
      if (ivBuffer.length !== this.IV_LENGTH) {
        throw new Error('Invalid IV length');
      }
      if (authTagBuffer.length !== this.AUTH_TAG_LENGTH) {
        throw new Error('Invalid authentication tag length');
      }

      const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Chat decryption failed (possible tampering):', error);
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('⚠️ Message authentication failed - message may have been tampered with');
      }
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * ✅ Leave channel (clear from memory)
   */
  leaveChannel(channelId: number): void {
    this.userSession.channelKeys.delete(channelId);
    console.log(`👋 Left channel ${channelId} - key cleared from memory`);
  }

  /**
   * ✅ Check if user is ready for E2E encryption
   */
  isEncryptionInitialized(): boolean {
    return !!this.userSession.privateKey && !!this.userSession.userId;
  }

  /**
   * ✅ Get current user ID
   */
  getCurrentUserId(): number | undefined {
    return this.userSession.userId;
  }

  /**
   * ✅ Get list of joined channels
   */
  getJoinedChannels(): number[] {
    return Array.from(this.userSession.channelKeys.keys());
  }

  /**
   * ✅ Check if user is member of channel
   */
  isChannelMember(channelId: number): boolean {
    return this.userSession.channelKeys.has(channelId);
  }

  // ============================================
  // DEVICE FINGERPRINT
  // ============================================
  private getDeviceFingerprint(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const fingerprint = Cookies.get('device_fingerprint');
      if (fingerprint) return fingerprint;

      // Generate simple fingerprint for MVP
      const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset().toString(),
        screen.width + 'x' + screen.height,
        screen.colorDepth.toString(),
      ];

      const newFingerprint = crypto
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex');

      // Store for 365 days
      Cookies.set('device_fingerprint', newFingerprint, {
        expires: 365,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return newFingerprint;
    } catch (error) {
      console.error('Failed to generate device fingerprint:', error);
      return null;
    }
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================
  private setTokens(accessToken: string, refreshToken: string) {
    const cookieOptions = {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    Cookies.set('accessToken', accessToken, cookieOptions);
    Cookies.set('refreshToken', refreshToken, cookieOptions);

    console.log('✅ Tokens updated in cookies');
  }

  private handleLogout() {
    console.log('🚪 Logging out - clearing all sensitive data');

    // ✅ Clear encryption keys from memory
    if (this.userSession.privateKey) {
      this.userSession.privateKey = '';
    }
    this.userSession.channelKeys.clear();
    this.userSession.userId = undefined;

    // Clear tokens
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    Cookies.remove('user', { path: '/' });

    console.log('✅ All sensitive data cleared from memory');

    // Only redirect if not already on auth page
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const authPaths = ['/sign-in', '/sign-up', '/verify', '/forgot-password', '/reset-password'];
      const isAuthPage = authPaths.some(path => currentPath.startsWith(path));

      if (!isAuthPage) {
        window.location.href = '/sign-in?session_expired=true';
      }
    }
  }

  /**
   * ✅ Clear all sensitive data on session end
   */
  clearSensitiveData(): void {
    this.handleLogout();
  }

  // ============================================
  // HTTP METHODS (unchanged)
  // ============================================
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  getAccessToken(): string | undefined {
    return Cookies.get('accessToken');
  }

  getRefreshToken(): string | undefined {
    return Cookies.get('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  clearAuth() {
    this.handleLogout();
  }
}

export const encryptedApiClient = new EncryptedApiClient();