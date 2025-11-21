// lib/api/services/tenant.service.ts
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';

export interface UpdateTenantPayload {
  name?: string;
  logoUrl?: string;
  timezone?: string;
  locale?: string;
  currency?: string;
}

export interface TenantMember {
  id: number;
  member_id: number;
  user_id: number;
  tenant_id: number;
  role_id: number;
  role_name: string;
  member_type: string;
  is_active: boolean;
  joined_at: string;
  email: string;
  first_name: string;
  last_name: string;
  role_display_name?: string;
}

export interface TenantUsage {
  limits: {
    staff: number;
    storageGb: number;
    campaigns: number;
    invitations: number;
    creators: number;
    brands: number;
  };
  current: {
    staff: number;
    storageGb: number;
    campaigns: number;
    invitations: number;
    creators: number;
    brands: number;
  };
  usage: {
    staffPercent: number;
    storagePercent: number;
    campaignsPercent: number;
  };
}

export interface Tenant {
  id: number;
  tenantType: string;
  name: string;
  slug: string;
  logoUrl?: string;
  subscriptionStatus: string;
  isTrial: boolean;
  trialEndsAt?: string;
  roleId?: number;
  roleName?: string;
  memberType?: string;
  joinedAt?: string;
  ownerEmail?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  memberCount?: number;
  timezone?: string;
  locale?: string;
  currency?: string;
}

export class TenantService {
  /**
   * Get all tenants for the current user
   */
  static async getMyTenants() {
    return encryptedApiClient.get<Tenant[]>(API_ENDPOINTS.TENANTS.MY_TENANTS);
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId: number) {
    return encryptedApiClient.get<Tenant>(API_ENDPOINTS.TENANTS.GET(tenantId.toString()));
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId: number, payload: UpdateTenantPayload) {
    return encryptedApiClient.put<Tenant>(
      API_ENDPOINTS.TENANTS.UPDATE(tenantId.toString()),
      payload
    );
  }

  /**
   * Get tenant members
   */
  static async getTenantMembers(tenantId: number) {
    return encryptedApiClient.get<TenantMember[]>(
      API_ENDPOINTS.TENANTS.MEMBERS(tenantId.toString())
    );
  }

  /**
   * Get tenant usage statistics
   */
  static async getTenantUsage(tenantId: number) {
    return encryptedApiClient.get<TenantUsage>(
      API_ENDPOINTS.TENANTS.USAGE(tenantId.toString())
    );
  }

  /**
   * Rotate tenant encryption keys
   */
  static async rotateTenantKeys(tenantId: number) {
    return encryptedApiClient.post<{
      message: string;
      keyVersion: number;
      rotatedAt: string;
    }>(`/tenants/${tenantId}/rotate-keys`);
  }
}