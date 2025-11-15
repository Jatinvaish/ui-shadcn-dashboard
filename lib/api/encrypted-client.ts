// lib/api/encrypted-client.ts - FIXED TOKEN REFRESH
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import * as crypto from 'crypto';

interface UserSession {
  userId?: number;
  privateKey?: string;
  channelKeys: Map<number, string>;
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

  private userSession: UserSession = {
    channelKeys: new Map(),
  };

  constructor() {
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';

    if (!encryptionKey || encryptionKey.length < 32) {
      console.error('⚠️ NEXT_PUBLIC_ENCRYPTION_KEY must be at least 32 characters!');
    }

    this.masterKey = crypto.pbkdf2Sync(
      encryptionKey,
      'fluera-platform-salt',
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
    this.startTokenRefreshTimer(); // NEW: Proactive token refresh
  }

  // NEW: Proactive token refresh before expiry
  private startTokenRefreshTimer() {
    setInterval(async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');
      
      if (!accessToken || !refreshToken) return;
      
      try {
        // Decode token to check expiry (without verification)
        const tokenParts = accessToken.split('.');
        if (tokenParts.length !== 3) return;
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        
        // Refresh if less than 2 minutes until expiry
        if (timeUntilExpiry < 120000 && timeUntilExpiry > 0) {
          console.log('🔄 Proactive token refresh triggered');
          await this.refreshAccessToken(refreshToken);
        }
      } catch (error) {
        console.error('Token refresh timer error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  private setupInterceptors() {
    // REQUEST INTERCEPTOR
    this.client.interceptors.request.use(
      async (config) => {
        // Get fresh token from cookies for each request
        const token = Cookies.get('accessToken');
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        config.headers['X-Request-ID'] = requestId;
        config.headers['X-Encryption-Enabled'] = 'true';

        const deviceFingerprint = this.getDeviceFingerprint();
        if (deviceFingerprint) {
          config.headers['X-Device-Fingerprint'] = deviceFingerprint;
        }

        // Skip encryption for auth/refresh endpoint
        if (config.url?.includes('auth/refresh')) {
          return config;
        }

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

    // RESPONSE INTERCEPTOR
    this.client.interceptors.response.use(
      async (response) => {
        const requestId = response.config.headers?.['X-Request-ID'];

        if (response.data?.__payload) {
          try {
            const { __checksum, __payload } = response.data;

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

        // Don't retry refresh endpoint
        if (originalRequest?.url?.includes('auth/refresh')) {
          return Promise.reject(error);
        }

        // Handle 401 - Token Expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // If already refreshing, queue the request
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
            const refreshToken = Cookies.get('refreshToken');
            
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

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
            console.error('Token refresh failed:', refreshError);
            
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

  // FIXED TOKEN REFRESH
  private async refreshAccessToken(refreshToken: string) {
    try {
      const requestId = `refresh-${Date.now()}`;
      console.log(`[${requestId}] 🔄 Refreshing access token...`);

      // Make a simple POST request without encryption for refresh endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
          },
          withCredentials: true,
          timeout: 10000,
        }
      );

      const data = response.data;
      console.log(`[${requestId}] ✅ Token refreshed successfully`);
      
      // Return tokens
      return {
        accessToken: data.accessToken || data.data?.accessToken,
        refreshToken: data.refreshToken || data.data?.refreshToken
      };
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error?.response?.data || error.message);
      throw error;
    }
  }

  // TRANSPORT ENCRYPTION
  private encryptTransport(text: string): string {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.masterKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Transport encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

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

  private generateChecksum(data: string): string {
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';
    return crypto
      .createHash('sha256')
      .update(data + encryptionKey)
      .digest('hex');
  }

  private getDeviceFingerprint(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const fingerprint = Cookies.get('device_fingerprint');
      if (fingerprint) return fingerprint;

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

    if (this.userSession.privateKey) {
      this.userSession.privateKey = '';
    }
    this.userSession.channelKeys.clear();
    this.userSession.userId = undefined;

    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    Cookies.remove('user', { path: '/' });

    console.log('✅ All sensitive data cleared from memory');

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const authPaths = ['/sign-in', '/sign-up', '/verify', '/forgot-password', '/reset-password'];
      const isAuthPage = authPaths.some(path => currentPath.startsWith(path));

      if (!isAuthPage) {
        window.location.href = '/sign-in?session_expired=true';
      }
    }
  }

  clearSensitiveData(): void {
    this.handleLogout();
  }

  // HTTP METHODS
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
