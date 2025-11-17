// lib/api/services/rbac-service.ts - UPDATED WITH BACKEND DTO ALIGNMENT
import { API_ENDPOINTS, encryptedApiClient } from "@/lib/api";

// =============================================
// CORE INTERFACES (Aligned with Backend DTOs)
// =============================================

// Role Interfaces
export interface CreateRolePayload {
  name: string;
  displayName?: string;
  description?: string;
  hierarchyLevel?: number;
  isSystemRole?: boolean;
  isDefault?: boolean;
}
export interface ListPermissionsParams {
  page?: number;
  limit?: number;
  category?: string;
  scope?: 'all' | 'system' | 'custom'; // ✅ Add scope
}
export interface UpdateRolePayload {
  roleId: number;
  displayName?: string;
  description?: string;
  hierarchyLevel?: number;
}

export interface Role {
  id: number;
  name: string;
  display_name?: string;
  displayName?: string;
  description?: string;
  hierarchy_level: number;
  hierarchyLevel?: number;
  is_system_role: boolean;
  isSystemRole?: boolean;
  is_default?: boolean;
  isDefault?: boolean;
  tenant_id?: number;
  tenantId?: number;
  users_count?: number;
  permissions_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

// Permission Interfaces
export interface CreatePermissionPayload {
  resource: string;
  action: string;
  description?: string;
  category?: string;
  isSystemPermission?: boolean;
}

export interface Permission {
  id: number;
  permission_key: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
  is_system_permission: boolean;
  created_at: string;
  updated_at?: string;
}

// List Parameters
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  scope?: 'all' | 'system' | 'tenant' | 'custom';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Role-Permission Interfaces
export interface AssignPermissionsPayload {
  roleId: number;
  permissionKeys: string[];
}

export interface BulkAssignPermissionsPayload {
  roleId: number;
  changes: Array<{ mode: 'I' | 'D'; permissionId: number }>;
}

export interface PermissionTree {
  roleId: number;
  permissions_tree: Array<{
    category: string;
    permissions: Array<{
      id: number;
      permission_key: string;
      resource: string;
      action: string;
      description?: string;
      is_checked: boolean;
      is_system_permission: boolean;
    }>;
  }>;
  summary: {
    total_permissions: number;
    assigned_permissions: number;
    total_categories: number;
  };
}

// User-Role Interfaces
export interface AssignRolePayload {
  userId: number;
  roleId: number;
}

export interface UserRole {
  id?: number;
  userId: number;
  user_id?: number;
  roleId: number;
  role_id?: number;
  assignedAt?: string;
  assigned_at?: string;
  assignedBy?: number;
  is_active?: boolean;
  expires_at?: string;
  role?: Role;
  role_name?: string;
  role_display_name?: string;
  hierarchy_level?: number;
  is_system_role?: boolean;
  user_email?: string;
  display_name?: string;
}

// Menu-Permission Interfaces
export interface LinkMenuPermissionPayload {
  menuKey: string;
  permissionId: number;
  isRequired?: boolean;
}

export interface BulkLinkMenuPermissionsPayload {
  mappings: Array<{
    menuKey: string;
    permissionId: number;
    isRequired?: boolean;
  }>;
}

export interface MenuPermission {
  id: number;
  menu_key: string;
  permission_id: number;
  permission_key: string;
  resource?: string;
  action?: string;
  category?: string;
  description?: string;
  is_required: boolean;
  is_system_permission: boolean;
  created_at: string;
}

export interface ListMenuPermissionsParams extends ListParams {
  menuKey?: string;
}

export interface UserAccessibleMenusResponse {
  userId: number;
  userPermissions: Permission[];
  accessibleMenus: string[];
  blockedMenus: Array<{
    menu_key: string;
    blocked_reasons?: string[];
    required_permissions?: string[];
  }>;
}

// Resource Permission Interfaces
export interface GrantResourcePermissionDto {
  resourceType: string;
  resourceId: number;
  entityType: 'user' | 'role';
  entityId: number;
  permissionType: string;
  expiresAt?: string;
}

export interface RevokeResourcePermissionDto {
  resourceType: string;
  resourceId: number;
  entityType: 'user' | 'role';
  entityId: number;
  permissionType?: string;
}

export interface CheckResourcePermissionDto {
  resourceType: string;
  resourceId: number;
  permissionType: string;
}

export interface ResourcePermission {
  id: number;
  resource_type: string;
  resource_id: number;
  entity_type: 'user' | 'role';
  entity_id: number;
  permission_type: string;
  granted_by?: number;
  expires_at?: string;
  created_at: string;
}

// Role Limit Interfaces
export interface CreateRoleLimitDto {
  roleId: number;
  limitType: 'invitations' | 'campaigns' | 'contracts' | 'storage' | 'creators' | 'brands';
  limitValue: number;
  resetPeriod?: 'daily' | 'monthly' | 'yearly' | 'never';
}

export interface UpdateRoleLimitDto {
  limitId: number;
  limitValue?: number;
  resetPeriod?: 'daily' | 'monthly' | 'yearly' | 'never';
}

export interface RoleLimit {
  id: number;
  role_id: number;
  limit_type: string;
  limit_value: number;
  current_usage: number;
  reset_period: 'daily' | 'monthly' | 'yearly' | 'never';
  last_reset_at?: string;
  created_at: string;
  updated_at?: string;
}

// =============================================
// ENHANCED OPERATIONS INTERFACES
// =============================================

export interface BulkAssignRolesPayload {
  userId: number;
  roleIds: number[];
}

export interface BulkRemoveRolesPayload {
  userId: number;
  roleIds: number[];
}

export interface BulkAssignUsersToRolePayload {
  roleId: number;
  userIds: number[];
}

export interface CloneRolePayload {
  sourceRoleId: number;
  newName: string;
  newDisplayName?: string;
  description?: string;
  copyPermissions?: boolean;
  copyLimits?: boolean;
}

export interface CompareRolesPayload {
  roleId1: number;
  roleId2: number;
}

export interface SearchPermissionsPayload {
  search?: string;
  resource?: string;
  category?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export interface GetAvailablePermissionsPayload {
  roleId: number;
  category?: string;
  search?: string;
}

export interface GetMenuHierarchyPayload {
  userId?: number;
  includeBlockedReasons?: boolean;
}

export interface GetTenantRolesPayload {
  includeSystemRoles?: boolean;
  status?: 'active' | 'inactive' | 'all';
}

export interface TransferRoleOwnershipPayload {
  roleId: number;
  newTenantId: number;
}

export interface ValidateRoleAssignmentPayload {
  userId: number;
  roleId: number;
}

export interface ValidateRoleNamePayload {
  roleName: string;
  tenantId?: number;
  excludeRoleId?: number;
}

export interface GetRoleAssignmentHistoryPayload {
  userId?: number;
  roleId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetUserAccessReportPayload {
  userId: number;
  includeInheritedPermissions?: boolean;
  includeMenuAccess?: boolean;
  includeResourcePermissions?: boolean;
}

export interface UserAccessReport {
  user: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    user_type?: string;
  };
  roles: Role[];
  permissions: Permission[];
  accessibleMenus: Array<{
    key: string;
    title: string;
    path: string;
  }>;
  summary: {
    totalRoles: number;
    totalPermissions: number;
    accessibleMenusCount: number;
    highestHierarchy: number;
  };
}

// =============================================
// RBAC SERVICE CLASS
// =============================================

export class RbacService {
  // ==================== ROLES ====================

  static async listRoles(payload: ListParams = {}): Promise<{
    data: {
      rolesList: Role[];
      meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      }
    }
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLES.LIST, payload);
  }

  static async getRole(roleId: number): Promise<{ data: Role }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLES.GET, { roleId });
  }

  static async createRole(payload: CreateRolePayload): Promise<{ data: Role }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLES.CREATE, payload);
  }

  static async updateRole(payload: UpdateRolePayload): Promise<{ data: Role }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLES.UPDATE, payload);
  }

  static async deleteRole(roleId: number): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLES.DELETE, { roleId });
  }

  // ==================== PERMISSIONS ====================

  static async getPermission(permissionId: number): Promise<{ data: Permission }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.GET, { permissionId });
  }

  static async createPermission(payload: CreatePermissionPayload): Promise<{ data: Permission }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.CREATE, payload);
  }

  static async deletePermission(permissionId: number): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.DELETE, { permissionId });
  }
  static async listPermissions(params: ListPermissionsParams  = {}) {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.LIST, {
      page: params.page || 1,
      limit: params.limit || 100,
      category: params.category,
      scope: params.scope || 'all',
    });
  }

  static async getAllPermissions() {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.LIST, {
      page: 1,
      limit: 500,
      scope: 'all',
    });
  }

  static async assignPermissionsToRole(payload: AssignPermissionsPayload): Promise<{
    success: boolean;
    data: { assigned_permissions: number };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_PERMISSIONS.ASSIGN, payload);
  }

  static async bulkAssignRolePermissions(roleId: number, changes: Array<{ mode: 'I' | 'D'; permissionId: number }>): Promise<{
    success: boolean;
    data: {
      assigned_permissions: number;
      deleted_permissions: number;
      total_changes: number;
      current_total_permissions: number;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_PERMISSIONS.BULK_ASSIGN, {
      roleId,
      changes,
    });
  }

  static async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_PERMISSIONS.REMOVE, {
      roleId,
      permissionIds,
    });
  }

  // ==================== USER-ROLES ====================

  static async assignRoleToUser(payload: AssignRolePayload): Promise<{
    success: boolean;
    data: UserRole;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.ASSIGN, payload);
  }

  static async getUserRoles(userId: number): Promise<{
    success: boolean;
    data: UserRole[];
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.LIST, { userId });
  }

  static async removeRoleFromUser(userId: number, roleId: number): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.REMOVE, {
      userId,
      roleId,
    });
  }

  static async getUserEffectivePermissions(userId: number): Promise<{
    success: boolean;
    data: {
      userId: number;
      roles: UserRole[];
      permissions: Permission[];
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.EFFECTIVE_PERMISSIONS, {
      userId,
    });
  }

  // ==================== MENU PERMISSIONS ====================

  static async linkMenuPermission(payload: LinkMenuPermissionPayload): Promise<{
    success: boolean;
    data: MenuPermission;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.LINK, payload);
  }

  static async bulkLinkMenuPermissions(payload: BulkLinkMenuPermissionsPayload): Promise<{
    success: boolean;
    data: MenuPermission[];
    created: number;
    total: number;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.BULK_LINK, payload);
  }

  static async unlinkMenuPermission(payload: { menuKey: string; permissionId: number }): Promise<{
    success: boolean;
    data: MenuPermission;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.UNLINK, payload);
  }

  static async getMenuPermissions(menuKey: string): Promise<{
    success: boolean;
    data: MenuPermission[];
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.MENU_GET, {
      menuKey,
    });
  }

  static async listMenuPermissions(payload: ListMenuPermissionsParams = {}): Promise<{
    success: boolean;
    data: {
      menuPermissionsList: MenuPermission[];
      meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.LIST, payload);
  }

  static async getMyAccessibleMenus(): Promise<{
    success: boolean;
    data: UserAccessibleMenusResponse;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.MY_ACCESS, {});
  }

  static async getUserAccessibleMenus(userId?: number): Promise<{
    success: boolean;
    data: UserAccessibleMenusResponse;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.USER_ACCESS, {
      userId,
    });
  }

  static async checkMenuAccess(menuKey: string, userId?: number): Promise<{
    success: boolean;
    data: {
      canAccess: boolean;
      menuKey: string;
      userId: string;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.CHECK_ACCESS, {
      menuKey,
      userId,
    });
  }

  // ==================== RESOURCE PERMISSIONS ====================

  static async grantResourcePermission(payload: GrantResourcePermissionDto): Promise<{
    success: boolean;
    data: ResourcePermission;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.GRANT, payload);
  }

  static async revokeResourcePermission(payload: RevokeResourcePermissionDto): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.REVOKE, payload);
  }

  static async checkResourcePermission(payload: CheckResourcePermissionDto): Promise<{
    success: boolean;
    data: { hasPermission: boolean };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.CHECK, payload);
  }

  static async checkBatchPermissions(checks: CheckResourcePermissionDto[]): Promise<{
    success: boolean;
    data: Array<{
      resourceType: string;
      resourceId: number;
      permissionType: string;
      hasPermission: boolean;
    }>;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.CHECK_BATCH, {
      checks,
    });
  }

  static async listResourcePermissions(resourceType: string, resourceId: number): Promise<{
    success: boolean;
    data: ResourcePermission[];
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.LIST, {
      resourceType,
      resourceId,
    });
  }

  // ==================== ROLE LIMITS ====================

  static async createRoleLimit(payload: CreateRoleLimitDto): Promise<{
    success: boolean;
    data: RoleLimit;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_LIMITS.CREATE, payload);
  }

  static async updateRoleLimit(payload: UpdateRoleLimitDto): Promise<{
    success: boolean;
    data: RoleLimit;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_LIMITS.UPDATE, payload);
  }

  static async getRoleLimits(roleId: number): Promise<{
    success: boolean;
    data: RoleLimit[];
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_LIMITS.GET, { roleId });
  }

  // ==================== ENHANCED OPERATIONS ====================

  static async bulkAssignRolesToUser(payload: BulkAssignRolesPayload): Promise<{
    success: boolean;
    data: {
      userId: number;
      totalRequested: number;
      successCount: number;
      failedCount: number;
      results: Array<{
        roleId: number;
        status: 'success' | 'failed' | 'skipped';
        reason?: string;
        roleName?: string;
      }>;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BULK_ASSIGN_ROLES, payload);
  }

  static async bulkRemoveRolesFromUser(payload: BulkRemoveRolesPayload): Promise<{
    success: boolean;
    data: {
      userId: number;
      totalRequested: number;
      successCount: number;
      failedCount: number;
      results: Array<{
        roleId: number;
        status: 'success' | 'failed' | 'skipped';
        reason?: string;
        roleName?: string;
      }>;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BULK_REMOVE_ROLES, payload);
  }

  static async bulkAssignUsersToRole(payload: BulkAssignUsersToRolePayload): Promise<{
    success: boolean;
    data: {
      roleId: number;
      roleName: string;
      totalRequested: number;
      successCount: number;
      failedCount: number;
      results: Array<{
        userId: number;
        status: 'success' | 'failed' | 'skipped';
        reason?: string;
        userEmail?: string;
        userName?: string;
      }>;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BULK_ASSIGN_USERS, payload);
  }

  static async cloneRole(payload: CloneRolePayload): Promise<{
    success: boolean;
    data: {
      newRole: Role;
      sourceRole: {
        id: number;
        name: string;
        display_name: string;
      };
      copiedPermissions: number;
      copiedLimits: number;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.CLONE_ROLE, payload);
  }

  static async compareRoles(payload: CompareRolesPayload): Promise<{
    success: boolean;
    data: {
      role1: {
        id: number;
        name: string;
        display_name: string;
        hierarchy_level: number;
        total_permissions: number;
      };
      role2: {
        id: number;
        name: string;
        display_name: string;
        hierarchy_level: number;
        total_permissions: number;
      };
      comparison: {
        common_permissions: number;
        unique_to_role1: number;
        unique_to_role2: number;
        similarity_percentage: number;
      };
      permissions: {
        common: Permission[];
        only_in_role1: Permission[];
        only_in_role2: Permission[];
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.COMPARE_ROLES, payload);
  }

  static async searchPermissions(payload: SearchPermissionsPayload): Promise<{
    success: boolean;
    data: {
      permissions: Permission[];
      meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.SEARCH_PERMISSIONS, payload);
  }

  static async getAvailablePermissionsForRole(payload: GetAvailablePermissionsPayload): Promise<{
    success: boolean;
    data: {
      roleId: number;
      availablePermissions: Permission[];
      groupedByCategory: Record<string, Permission[]>;
      totalAvailable: number;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.AVAILABLE_PERMISSIONS, payload);
  }

  static async getMenuHierarchyWithAccess(payload: GetMenuHierarchyPayload): Promise<{
    success: boolean;
    data: {
      userId: number;
      hierarchy: any[];
      summary: {
        totalMenus: number;
        accessibleMenus: number;
        blockedMenus: number;
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.MENU_HIERARCHY, payload);
  }

  static async getBlockedMenus(payload: { userId?: number }): Promise<{
    success: boolean;
    data: {
      userId: number;
      blockedMenus: Array<{
        key: string;
        title: string;
        path: string;
        blockedReasons: string[];
        requiredPermissions: string[];
      }>;
      totalBlocked: number;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BLOCKED_MENUS, payload);
  }

  static async getTenantRoles(payload: GetTenantRolesPayload): Promise<{
    success: boolean;
    data: {
      tenantId: number;
      includeSystemRoles: boolean;
      roles: Role[];
      summary: {
        totalRoles: number;
        systemRoles: number;
        customRoles: number;
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.TENANT_ROLES, payload);
  }

  static async validateRoleAssignment(payload: ValidateRoleAssignmentPayload): Promise<{
    success: boolean;
    data: {
      canAssign: boolean;
      reason?: string;
      roleName?: string;
      roleHierarchy?: number;
      requestorHierarchy?: number;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.VALIDATE_ASSIGNMENT, payload);
  }

  static async validateRoleName(payload: ValidateRoleNamePayload): Promise<{
    success: boolean;
    data: {
      isAvailable: boolean;
      roleName: string;
      conflict?: any;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.VALIDATE_NAME, payload);
  }

  static async getRoleAssignmentHistory(payload: GetRoleAssignmentHistoryPayload): Promise<{
    success: boolean;
    data: {
      history: any[];
      meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.ROLE_ASSIGNMENT_HISTORY, payload);
  }

  static async getUserAccessReport(payload: GetUserAccessReportPayload): Promise<{
    success: boolean;
    data: UserAccessReport;
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.USER_ACCESS_REPORT, payload);
  }

  static async getRolesByHierarchy(payload: {
    tenantId?: number;
    minLevel?: number;
    maxLevel?: number;
  }): Promise<{
    success: boolean;
    data: {
      roles: Role[];
      filters: {
        minLevel?: number;
        maxLevel?: number;
        tenantId?: number;
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.ROLES_BY_HIERARCHY, payload);
  }

  static async getUnassignedUsers(payload: {
    tenantId?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      users: any[];
      meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
      };
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.UNASSIGNED_USERS, payload);
  }

  static async getRoleUsageStats(payload: {
    tenantId?: number;
    roleId?: number;
    period?: string;
  }): Promise<{
    success: boolean;
    data: {
      stats: any[];
      period?: string;
      tenantId: number;
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.ROLE_USAGE_STATS, payload);
  }
}

export const rbacService = RbacService;
export default RbacService;