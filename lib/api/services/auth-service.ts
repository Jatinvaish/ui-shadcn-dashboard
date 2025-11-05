// lib/api/services/auth.service.ts - UPDATED
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ✅ UPDATED: Changed to match backend DTO
export interface CreateAgencyPayload {
  name: string; // ✅ Changed from organizationName
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
  industry?: string;
}

// ✅ UPDATED: Changed to match backend DTO
export interface CreateBrandPayload {
  name: string; // ✅ Changed from brandName
  firstName: string;
  lastName: string;
  phone?: string;
  website?: string;
  industry?: string;
  description?: string;
}

export interface CreateCreatorPayload {
  firstName: string;
  lastName: string;
  stageName?: string;
  phone?: string;
  bio?: string;
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

  // Logout
  static async logout() {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  // Verify Registration
  static async verifyRegistration(payload: { email: string; code: string }) {
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
  static async forgotPassword(payload: { email: string }) {
    return encryptedApiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, payload);
  }

  // Reset Password
  static async resetPassword(payload: { token: string; newPassword: string }) {
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
}