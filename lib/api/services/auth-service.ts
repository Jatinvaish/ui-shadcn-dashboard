// lib/api/services/auth.service.ts - COMPLETE
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';
import Cookies from 'js-cookie';

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateAgencyPayload {
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
  industry?: string;
  metadata?: any;
}

export interface CreateBrandPayload {
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  website?: string;
  industry?: string;
  metadata?: any;
}

export interface CreateCreatorPayload {
  firstName: string;
  lastName: string;
  stageName?: string;
  phone?: string;
  metadata?: any;
  bio?: string;
}

export interface VerifyRegistrationPayload {
  email: string;
  code: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export class AuthService {
  // Register
  static async register(payload: RegisterPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
  }

  // Login
  static async login(payload: LoginPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
  }


  // Verify Registration
  static async verifyRegistration(payload: VerifyRegistrationPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.VERIFY_REGISTRATION, payload);
  }

  // Resend Verification
  static async resendVerification(email: string) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
  }

  // Refresh Token
  static async refreshToken(refreshToken: string) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
  }

  // Get Current User
  static async getCurrentUser() {
    return encryptedApiClient.get(API_ENDPOINTS.AUTH.ME);
  }

  // Forgot Password
  static async forgotPassword(payload: ForgotPasswordPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, payload);
  }

  // Reset Password
  static async resetPassword(payload: ResetPasswordPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, payload);
  }

  // Create Agency
  static async createAgency(payload: CreateAgencyPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.CREATE_AGENCY, payload);
  }

  // Create Brand
  static async createBrand(payload: CreateBrandPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.CREATE_BRAND, payload);
  }

  // Create Creator
  static async createCreator(payload: CreateCreatorPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.CREATE_CREATOR, payload);
  }

  // Get User Sessions
  static async getUserSessions() {
    return encryptedApiClient.get(API_ENDPOINTS.AUTH.SESSIONS);
  }

  // Logout
  static async logout() {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }
  static updateAuthCookies(data: { accessToken?: string; refreshToken?: string; user?: any }) {
    const cookieOptions = {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    if (data.accessToken) {
      Cookies.set('accessToken', data.accessToken, cookieOptions);
    }

    if (data.refreshToken) {
      Cookies.set('refreshToken', data.refreshToken, cookieOptions);
    }

    if (data.user) {
      Cookies.set('user', JSON.stringify(data.user), cookieOptions);
    }
  }
}