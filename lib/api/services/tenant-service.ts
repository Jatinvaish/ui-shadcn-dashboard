// ============================================
// lib/api/services/tenant-service.ts - Enhanced
// ============================================
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';

export interface UpdateTenantPayload {
  name?: string;
  logoUrl?: string;
  timezone?: string;
  locale?: string;
  currency?: string;
}

export interface GetMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'email' | 'first_name' | 'role_name' | 'member_type' | 'status' | 'joined_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TenantMember {
  id: number;
  member_id: number;
  user_id: number;
  tenant_id?: number;
  role_id: number;
  role_name: string;
  member_type: string;
  status: string;
  is_active: boolean;
  joined_at: string | null;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url?: string | null;
  last_active_at?: string | null;
  role_display_name?: string;
}

export interface PaginatedMembersResponse {
  data: TenantMember[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
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
   * Get tenant members with pagination, sorting, and search
   */
  static async getTenantMembers(tenantId: number, params?: GetMembersParams) {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const url = `${API_ENDPOINTS.TENANTS.MEMBERS(tenantId.toString())}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    
    return encryptedApiClient.get<PaginatedMembersResponse>(url);
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