// lib/api/services/rbac.service.ts - COMPLETE IMPLEMENTATION

import { API_ENDPOINTS, encryptedApiClient } from "@/lib/api";

// ---------------------------------------------
// INTERFACES
// ---------------------------------------------
export interface CreateRolePayload {
  name: string;
  displayName?: string;
  description?: string;
  color?: string;
  hierarchyLevel?: number;
  isSystemRole?: boolean;
  isDefault?: boolean;
}

export interface UpdateRolePayload {
  roleId: number;
  displayName?: string;
  description?: string;
  hierarchyLevel?: number;
}

export interface CreatePermissionPayload {
  resource: string;
  action: string;
  description?: string;
  category?: string;
}

export interface AssignPermissionsPayload {
  roleId: number;
  permissionKeys: string[];
}

export interface BulkAssignPermissionsPayload {
  roleId: number;
  changes: Array<{ mode: 'I' | 'D'; permissionId: number }>;
}

export interface AssignRolePayload {
  userId: number;
  roleId: number;
}

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

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  scope?: 'all' | 'system' | 'tenant' | 'custom';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ListMenuPermissionsParams extends ListParams {
  menuKey?: string;
  name?: string;
}

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

export interface CreateRoleLimitDto {
  roleId: number;
  limitType: string;
  limitValue: number;
  resetPeriod?: 'daily' | 'monthly' | 'yearly' | 'never';
}

export interface UpdateRoleLimitDto {
  limitId: number;
  limitValue?: number;
  resetPeriod?: 'daily' | 'monthly' | 'yearly' | 'never';
}

export interface Role {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  color?: string;
  hierarchyLevel?: number;
  isSystemRole: boolean;
  isDefault: boolean;
  tenantId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: number;
  key: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  userId: number;
  roleId: number;
  assignedAt: string;
  assignedBy?: number;
  role?: Role;
}

export interface MenuPermission {
  menuKey: string;
  permissionId: number;
  isRequired: boolean;
  permission?: Permission;
}

export interface ResourcePermission {
  id: number;
  resourceType: string;
  resourceId: number;
  entityType: 'user' | 'role';
  entityId: number;
  permissionType: string;
  grantedAt: string;
  grantedBy?: number;
  expiresAt?: string;
}

export interface RoleLimit {
  id: number;
  roleId: number;
  limitType: string;
  limitValue: number;
  resetPeriod: 'daily' | 'monthly' | 'yearly' | 'never';
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------
// RBAC SERVICE
// ---------------------------------------------
export class RbacService {
  // ==================== ROLES ====================

  static async listRoles(payload: ListParams = {}): Promise<{ data: Role[]; total: number; page: number; limit: number }> {
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

  static async listPermissions(payload: ListParams = {}): Promise<{ data: Permission[]; total: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.LIST, payload);
  }

  static async getPermission(permissionId: number): Promise<{ data: Permission }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.GET, { permissionId });
  }

  static async createPermission(payload: CreatePermissionPayload): Promise<{ data: Permission }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.CREATE, payload);
  }

  static async deletePermission(permissionId: number): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.DELETE, { permissionId });
  }

  static async getAllPermissions(): Promise<{ data: Permission[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.PERMISSIONS.LIST, {
      page: 1,
      limit: 1000,
    });
  }

  // ==================== ROLE-PERMISSIONS ====================

  static async getRolePermissionsTree(roleId: number): Promise<{ data: any }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_PERMISSIONS.TREE, { roleId });
  }

  static async assignPermissionsToRole(payload: AssignPermissionsPayload): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_PERMISSIONS.ASSIGN, payload);
  }

  static async bulkAssignRolePermissions(payload: BulkAssignPermissionsPayload): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_PERMISSIONS.BULK_ASSIGN, payload);
  }

  static async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_PERMISSIONS.REMOVE, {
      roleId,
      permissionIds,
    });
  }

  // ==================== USER-ROLES ====================

  static async assignRoleToUser(payload: AssignRolePayload): Promise<{ data: UserRole }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.ASSIGN, payload);
  }

  static async getUserRoles(userId: number): Promise<{ data: UserRole[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.LIST, { userId });
  }

  static async removeRoleFromUser(userId: number, roleId: number): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.REMOVE, {
      userId,
      roleId,
    });
  }

  static async getUserEffectivePermissions(userId: number): Promise<{ data: Permission[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.USER_ROLES.EFFECTIVE_PERMISSIONS, {
      userId,
    });
  }

  // ==================== MENU PERMISSIONS ====================

  static async linkMenuPermission(payload: LinkMenuPermissionPayload): Promise<{ data: MenuPermission }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.LINK, payload);
  }

  static async bulkLinkMenuPermissions(payload: BulkLinkMenuPermissionsPayload): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.BULK_LINK, payload);
  }

  static async unlinkMenuPermission(payload: { menuKey: string; permissionId: number }): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.UNLINK, payload);
  }

  static async getMenuPermissions(menuKey: string): Promise<{ data: MenuPermission[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.MENU_GET, {
      menuKey,
    });
  }

  static async listMenuPermissions(payload: ListMenuPermissionsParams = {}): Promise<{ data: MenuPermission[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.LIST, payload);
  }

  static async getMyAccessibleMenus(): Promise<{ data: string[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.MY_ACCESS, {});
  }

  static async getUserAccessibleMenus(userId?: number): Promise<{ data: string[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.USER_ACCESS, {
      userId,
    });
  }

  static async checkMenuAccess(menuKey: string, userId?: number): Promise<{ hasAccess: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.MENU_PERMISSIONS.CHECK_ACCESS, {
      menuKey,
      userId,
    });
  }

  // ==================== RESOURCE PERMISSIONS ====================

  static async grantResourcePermission(payload: GrantResourcePermissionDto): Promise<{ data: ResourcePermission }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.GRANT, payload);
  }

  static async revokeResourcePermission(payload: RevokeResourcePermissionDto): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.REVOKE, payload);
  }

  static async checkResourcePermission(payload: CheckResourcePermissionDto): Promise<{ hasPermission: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.CHECK, payload);
  }

  static async checkBatchPermissions(checks: Array<{
    resourceType: string;
    resourceId: number;
    permissionType: string;
  }>): Promise<{ results: Array<{ hasPermission: boolean }> }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.CHECK_BATCH, {
      checks,
    });
  }

  static async listResourcePermissions(resourceType: string, resourceId: number): Promise<{ data: ResourcePermission[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.RESOURCE_PERMISSIONS.LIST, {
      resourceType,
      resourceId,
    });
  }

  // ==================== ROLE LIMITS ====================

  static async createRoleLimit(payload: CreateRoleLimitDto): Promise<{ data: RoleLimit }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_LIMITS.CREATE, payload);
  }

  static async updateRoleLimit(payload: UpdateRoleLimitDto): Promise<{ data: RoleLimit }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_LIMITS.UPDATE, payload);
  }

  static async getRoleLimits(roleId: number): Promise<{ data: RoleLimit[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ROLE_LIMITS.GET, { roleId });
  }

  // ==================== ENHANCED OPERATIONS ====================

  static async bulkAssignRolesToUser(payload: { userId: number; roleIds: number[] }): Promise<{ success: boolean; assigned: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BULK_ASSIGN_ROLES, payload);
  }

  static async bulkRemoveRolesFromUser(payload: { userId: number; roleIds: number[] }): Promise<{ success: boolean; removed: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BULK_REMOVE_ROLES, payload);
  }

  static async bulkAssignUsersToRole(payload: { roleId: number; userIds: number[] }): Promise<{ success: boolean; assigned: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BULK_ASSIGN_USERS, payload);
  }

  static async cloneRole(payload: {
    sourceRoleId: number;
    newName: string;
    newDisplayName?: string;
    description?: string;
    copyPermissions?: boolean;
    copyLimits?: boolean;
  }): Promise<{ data: Role }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.CLONE_ROLE, payload);
  }

  static async compareRoles(payload: { roleId1: number; roleId2: number }): Promise<{
    data: {
      commonPermissions: Permission[];
      uniqueToRole1: Permission[];
      uniqueToRole2: Permission[];
    };
  }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.COMPARE_ROLES, payload);
  }

  static async searchPermissions(payload: {
    search?: string;
    resource?: string;
    category?: string;
    action?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Permission[]; total: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.SEARCH_PERMISSIONS, payload);
  }

  static async getAvailablePermissionsForRole(payload: {
    roleId: number;
    category?: string;
    search?: string;
  }): Promise<{ data: Permission[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.AVAILABLE_PERMISSIONS, payload);
  }

  static async getMenuHierarchyWithAccess(payload: {
    userId?: number;
    includeBlockedReasons?: boolean;
  }): Promise<{ data: any }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.MENU_HIERARCHY, payload);
  }

  static async getBlockedMenus(payload: { userId?: number }): Promise<{ data: string[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.BLOCKED_MENUS, payload);
  }

  static async getTenantRoles(payload: {
    includeSystemRoles?: boolean;
    status?: 'all' | 'active' | 'inactive';
  }): Promise<{ data: Role[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.TENANT_ROLES, payload);
  }

  static async transferRoleOwnership(payload: {
    roleId: number;
    newTenantId: number;
  }): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.TRANSFER_ROLE, payload);
  }

  static async getTenantRoleAnalytics(payload: {
    tenantId?: number;
    metric?: string;
  }): Promise<{ data: any }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.ROLE_ANALYTICS, payload);
  }

  static async validateRoleAssignment(payload: {
    userId: number;
    roleId: number;
  }): Promise<{ valid: boolean; reason?: string }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.VALIDATE_ASSIGNMENT, payload);
  }

  static async validateRoleName(payload: {
    roleName: string;
    tenantId?: number;
    excludeRoleId?: number;
  }): Promise<{ valid: boolean; message?: string }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.VALIDATE_NAME, payload);
  }

  static async getRoleAssignmentHistory(payload: {
    userId?: number;
    roleId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.ROLE_ASSIGNMENT_HISTORY, payload);
  }

  static async getPermissionChangeHistory(payload: {
    roleId?: number;
    permissionId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.PERMISSION_CHANGE_HISTORY, payload);
  }

  static async getUserAccessReport(payload: {
    userId: number;
    includeInheritedPermissions?: boolean;
    includeMenuAccess?: boolean;
    includeResourcePermissions?: boolean;
  }): Promise<{ data: any }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.USER_ACCESS_REPORT, payload);
  }

  static async createRoleTemplate(payload: {
    templateName: string;
    sourceRoleId: number;
    description?: string;
  }): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.CREATE_TEMPLATE, payload);
  }

  static async listRoleTemplates(): Promise<{ data: any[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.LIST_TEMPLATES, {});
  }

  static async applyRoleTemplate(payload: {
    templateName: string;
    customRoleName?: string;
  }): Promise<{ data: Role }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.APPLY_TEMPLATE, payload);
  }

  static async getRolesByHierarchy(payload: {
    tenantId?: number;
    minLevel?: number;
    maxLevel?: number;
  }): Promise<{ data: Role[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.ROLES_BY_HIERARCHY, payload);
  }

  static async getUnassignedUsers(payload: {
    tenantId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.UNASSIGNED_USERS, payload);
  }

  static async getRoleUsageStats(payload: {
    tenantId?: number;
    roleId?: number;
    period?: string;
  }): Promise<{ data: any }> {
    return encryptedApiClient.post(API_ENDPOINTS.RBAC.ENHANCED.ROLE_USAGE_STATS, payload);
  }

  // ==================== STANDALONE PERMISSIONS (Backward Compatibility) ====================

  static listPermissionsStandalone(payload: ListParams = {}) {
    console.warn('Deprecated: Use RbacService.listPermissions instead');
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.LIST, payload);
  }

  static grantResourcePermissionStandalone(payload: any) {
    console.warn('Deprecated: Use RbacService.grantResourcePermission instead');
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.GRANT, payload);
  }

  static revokeResourcePermissionStandalone(payload: any) {
    console.warn('Deprecated: Use RbacService.revokeResourcePermission instead');
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.REVOKE, payload);
  }

  static async checkAccess(payload: {
    resourceType: string;
    resourceId: number;
    permissionType: string;
  }): Promise<{ hasAccess: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.ACCESS_CHECK, payload);
  }

  // ==================== SHARES ====================

  static async createShare(payload: {
    resourceType: string;
    resourceId: number;
    shareType?: string;
    recipientEmail?: string;
    recipientUserId?: number;
    recipientTenantId?: number;
    passwordProtected?: boolean;
    password?: string;
    requiresLogin?: boolean;
    allowDownload?: boolean;
    expiresAt?: string;
    maxViews?: number;
  }): Promise<{ data: any }> {
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.SHARE_CREATE, payload);
  }

  static async accessShare(payload: {
    shareToken: string;
    password?: string;
  }): Promise<{ data: any }> {
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.SHARE_ACCESS, payload);
  }

  static async revokeShare(shareId: number): Promise<{ success: boolean }> {
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.SHARE_REVOKE, { shareId });
  }

  static async listShares(resourceType: string, resourceId: number): Promise<{ data: any[] }> {
    return encryptedApiClient.post(API_ENDPOINTS.PERMISSIONS.SHARE_LIST, {
      resourceType,
      resourceId,
    });
  }
}

// Export singleton instance for convenience
export const rbacService = RbacService;

// Export default
export default RbacService;