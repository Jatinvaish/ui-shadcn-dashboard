// lib/api/encrypted-client.ts - FIXED CHECKSUM
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import * as crypto from 'crypto';

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
            const encrypted = this.encrypt(jsonString);
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

            const decrypted = this.decrypt(__payload);
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
      const encrypted = this.encrypt(payload);
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
        const decrypted = this.decrypt(data.__payload);
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
  // ✅ FIXED: AES-256-GCM ENCRYPTION (MATCHES BACKEND)
  // ============================================
  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.masterKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // ✅ Format: iv:authTag:encrypted (matches backend)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // ============================================
  // ✅ FIXED: AES-256-GCM DECRYPTION (MATCHES BACKEND)
  // ============================================
  private decrypt(encryptedData: string): string {
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
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // ============================================
  // ✅ FIXED: CHECKSUM GENERATION (MUST MATCH BACKEND)
  // ============================================
  private generateChecksum(data: string): string {
    // ✅ CRITICAL: Must match backend's checksum calculation exactly
    // Backend: crypto.createHash('sha256').update(payload + ENCRYPTION_KEY).digest('hex')
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';
    return crypto
      .createHash('sha256')
      .update(data + encryptionKey)
      .digest('hex');
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
    console.log('🚪 Logging out - clearing tokens');
    
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    Cookies.remove('user', { path: '/' });

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

  // ============================================
  // HTTP METHODS
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