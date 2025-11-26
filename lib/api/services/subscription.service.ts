// lib/api/services/subscription.service.ts

import { encryptedApiClient } from "../encrypted-client";
import { API_ENDPOINTS } from "../endpoints";

export interface CreatePlanPayload {
  planName: string;
  planSlug: string;
  planType: 'agency' | 'brand' | 'creator' | 'all';
  planTier?: 'free' | 'basic' | 'pro' | 'enterprise' | 'custom';
  isFree?: boolean;
  isDefault?: boolean;
  priceMonthly?: number;
  priceYearly?: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly' | 'lifetime';
  trialDays?: number;
  maxStaff?: number;
  maxStorageGb?: number;
  maxCampaigns?: number;
  maxInvitations?: number;
  maxIntegrations?: number;
  maxCreators?: number;
  maxBrands?: number;
  maxFileSizeMb?: number;
  maxApiCallsPerDay?: number;
  features?: any;
  prioritySupport?: boolean;
  customBranding?: boolean;
  whiteLabel?: boolean;
  ssoEnabled?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanPayload {
  planName?: string;
  isActive?: boolean;
  priceMonthly?: number;
  priceYearly?: number;
  maxStaff?: number;
  maxStorageGb?: number;
  maxCampaigns?: number;
  maxInvitations?: number;
  features?: any;
  prioritySupport?: boolean;
  customBranding?: boolean;
  whiteLabel?: boolean;
  ssoEnabled?: boolean;
}

export interface CreateCustomPlanPayload {
  tenantId: number;
  basePlanId?: number;
  customPlanName?: string;
  maxStaff?: number;
  maxStorageGb?: number;
  maxCampaigns?: number;
  maxInvitations?: number;
  maxCreators?: number;
  maxBrands?: number;
  maxIntegrations?: number;
  maxFileSizeMb?: number;
  maxApiCallsPerDay?: number;
  customPriceMonthly?: number;
  customPriceYearly?: number;
  currency?: string;
  customFeatures?: any;
  prioritySupport?: boolean;
  customBranding?: boolean;
  whiteLabel?: boolean;
  ssoEnabled?: boolean;
  expiresAt?: string;
  notes?: string;
}

export interface ChangeSubscriptionPayload {
  planId: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  changeReason?: string;
  effectiveDate?: string;
}

export interface CancelSubscriptionPayload {
  cancelReason: string;
  cancelImmediately?: boolean;
}

export interface ListPlansQuery {
  planTier?: 'free' | 'basic' | 'pro' | 'enterprise' | 'custom';
  includeInactive?: boolean;
}

export class SubscriptionService {
  // Plans Management
  static async listPlans(query?: ListPlansQuery) {
    return encryptedApiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.PLANS.LIST, { params: query });
  }

  static async getPlan(id: number) {
    return encryptedApiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.PLANS.GET(id));
  }

  static async createPlan(payload: CreatePlanPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.PLANS.CREATE, payload);
  }

  static async updatePlan(id: number, payload: UpdatePlanPayload) {
    return encryptedApiClient.put(API_ENDPOINTS.SUBSCRIPTIONS.PLANS.UPDATE(id), payload);
  }

  static async deletePlan(id: number) {
    return encryptedApiClient.delete(API_ENDPOINTS.SUBSCRIPTIONS.PLANS.DELETE(id));
  }

  // Custom Plans
  static async createCustomPlan(payload: CreateCustomPlanPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CUSTOM_PLANS.CREATE, payload);
  }

  static async getCustomPlan(tenantId: number) {
    return encryptedApiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.CUSTOM_PLANS.GET(tenantId));
  }

  // Subscription Management
  static async getMySubscription() {
    return encryptedApiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.MY_SUBSCRIPTION);
  }

  static async getTenantSubscription(tenantId: number) {
    return encryptedApiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.TENANT_SUBSCRIPTION(tenantId));
  }

  static async changeSubscription(payload: ChangeSubscriptionPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CHANGE, payload);
  }

  static async cancelSubscription(payload: CancelSubscriptionPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL, payload);
  }

  static async reactivateSubscription() {
    return encryptedApiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.REACTIVATE);
  }

  static async getSubscriptionHistory() {
    return encryptedApiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.HISTORY);
  }

  // Limits & Features
  static async checkLimit(limitType: string) {
    return encryptedApiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CHECK_LIMIT, { limitType });
  }

  static async checkFeature(featureName: string) {
    return encryptedApiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CHECK_FEATURE, { featureName });
  }

  static async getSubscriptionStatus() {
    return encryptedApiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.STATUS);
  }
}