// lib/api/services/rbac.service.ts - COMPLETE VERSION WITH ALL METHODS

import { encryptedApiClient } from '../encrypted-client';

// ==================== INTERFACES ====================

export interface CreateRolePayload {
  name: string;
  displayName?: string;
  description?: string;
  color?: string;
  hierarchyLevel?: number;
  organizationId?: number;
}

export interface UpdateRolePayload {
  roleId: number;
  displayName?: string;
  description?: string;
  color?: string;
  hierarchyLevel?: number;
}

export interface CreatePermissionPayload {
  name: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
}

export interface AssignPermissionsPayload {
  roleId: number;
  permissionIds: number[];
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

export interface UpdateMenuPermissionPayload {
  id: number;
  menuKey: string;
  permissionId: number;
  isRequired: boolean;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  scope?: 'all' | 'system' | 'organization' | 'custom';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ListMenuPermissionsParams extends ListParams {
  menuKey?: string;
}

export interface GrantResourcePermissionPayload {
  resourceType: string;
  resourceId: number;
  entityType: 'user' | 'role' | 'team';
  entityId: number;
  permissionType: 'read' | 'write' | 'share' | 'delete' | 'comment';
  expiresAt?: string;
}

export interface RevokeResourcePermissionPayload {
  resourceType: string;
  resourceId: number;
  entityType: string;
  entityId: number;
  permissionType?: string;
}

export interface CheckResourcePermissionPayload {
  resourceType: string;
  resourceId: number;
  permissionType: string;
}

export interface CheckAccessPayload {
  resourceType: string;
  resourceId: number;
  permissionType: string;
}

export interface CreateSharePayload {
  resourceType: string;
  resourceId: number;
  shareType: 'view' | 'comment' | 'edit';
  recipientEmail?: string;
  recipientUserId?: number;
  passwordProtected?: boolean;
  password?: string;
  requiresLogin?: boolean;
  allowDownload?: boolean;
  expiresAt?: string;
  maxViews?: number;
}

export interface AccessSharePayload {
  shareToken: string;
  password?: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  hierarchy_level: number;
  permissions_count: number;
  users_count: number;
  is_default?: boolean;
  is_system_role: boolean;
  organization_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  permission_key: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
  is_system_permission: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  assignedat: string;
  name: string;
  resource: string;
  action: string;
  category?: string;
  description?: string;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  is_active: boolean;
  assigned_at: string;
  name: string;
  display_name: string;
  hierarchy_level: number;
}

export interface MenuPermission {
  id: number;
  menu_key: string;
  permission_id: number;
  is_required: boolean;
  created_at: string;
  permission_name: string;
  permission_key: string;
  resource: string;
  action: string;
  category?: string;
  description?: string;
  is_system_permission?: boolean;
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ResourcePermission {
  id: number;
  resource_type: string;
  resource_id: number;
  entity_type: string;
  entity_id: number;
  permission_type: string;
  granted_by: number;
  expires_at?: string;
  created_at: string;
  entityName?: string;
  entity_name?: string;
  entity_display_name?: string;
  granted_by_email?: string;
}

export interface ResourceShare {
  id: number;
  resource_type: string;
  resource_id: number;
  share_token: string;
  share_type: string;
  recipient_email?: string;
  recipient_user_id?: number;
  password_protected: boolean;
  requires_login: boolean;
  allow_download: boolean;
  expires_at?: string;
  max_views?: number;
  view_count: number;
  revoked_at?: string;
  created_at: string;
  created_by: number;
  shareUrl?: string;
}

export interface UserAccessibleMenusResponse {
  success: boolean;
  data: {
    userId: string;
    userPermissions: Permission[];
    accessibleMenus: string[];
    blockedMenus: string[];
  };
}

export class RbacService {

  // ==================== ROLES ====================

  static async listRoles(filters: ListParams = {}) {
    return encryptedApiClient.post<{
      data: {
        rolesList: Role[];
        meta: PaginationMeta;
      };
    }>('/rbac/roles/list', filters);
  }

  static async getRole(roleId: number) {
    return encryptedApiClient.post<{ data: Role }>('/rbac/roles/get', { roleId });
  }

  static async createRole(payload: CreateRolePayload) {
    return encryptedApiClient.post<{ data: Role }>('/rbac/roles/create', payload);
  }

  static async updateRole(payload: UpdateRolePayload) {
    return encryptedApiClient.post<{ data: Role }>('/rbac/roles/update', payload);
  }

  static async deleteRole(roleId: number) {
    return encryptedApiClient.post('/rbac/roles/delete', { roleId });
  }

  // ==================== HIERARCHICAL ROLE PERMISSIONS ====================

  /**
   * Get permissions tree for a role (for Manage Permissions page)
   * Returns hierarchical structure grouped by category/module with checked state
   */
  static async getRolePermissionsTree(roleId: number) {
    return encryptedApiClient.post<{
      success: boolean;
      data: {
        role: {
          role_id: string;
          role_name: string;
          is_system_role: boolean;
        };
        permissions_tree: Array<{
          category: string;
          modules: Array<{
            module_name: string;
            parent_permissions: Array<{
              id: number;
              name: string;
              action: string;
              description: string;
              is_checked: boolean;
              is_system_permission: boolean;
            }>;
            child_permissions: Array<{
              id: number;
              name: string;
              action: string;
              description: string;
              is_checked: boolean;
              is_system_permission: boolean;
              parent_id: number;
            }>;
          }>;
        }>;
        summary: {
          total_permissions: number;
          assigned_permissions: number;
          total_categories: number;
        };
      };
    }>('/rbac/roles/permissions/tree', { roleId });
  }

  /**
   * Bulk update role permissions
   * Accepts array of changes: [{ mode: 'I', permissionId: 1 }, { mode: 'D', permissionId: 2 }]
   */
  static async bulkAssignRolePermissions(
    roleId: number, 
    changes: Array<{ mode: 'I' | 'D'; permissionId: number }>
  ) {
    return encryptedApiClient.post<{
      success: boolean;
      data: {
        assigned_permissions: number;
        deleted_permissions: number;
        total_changes: number;
        current_total_permissions: number;
      };
      message: string;
    }>('/rbac/roles/permissions/bulk-assign', { roleId, changes });
  }

  // ==================== PERMISSIONS ====================

  static async listPermissions(filters: ListParams = {}) {
    return encryptedApiClient.post<{
      data: {
        permissionsList: Permission[];
        meta: PaginationMeta;
      };
    }>('/rbac/permissions/list', filters);
  }

  static async getPermission(permissionId: number) {
    return encryptedApiClient.post<{ data: Permission }>('/rbac/permissions/get', { permissionId });
  }

  static async createPermission(payload: CreatePermissionPayload) {
    return encryptedApiClient.post<{ data: Permission }>('/rbac/permissions/create', payload);
  }

  static async deletePermission(permissionId: number) {
    return encryptedApiClient.post('/rbac/permissions/delete', { permissionId });
  }

  // ==================== USER ROLES ====================

  static async assignRoleToUser(payload: AssignRolePayload) {
    return encryptedApiClient.post<{
      success: boolean;
      data: any;
      message: string;
    }>('/rbac/users/roles/assign', payload);
  }

  static async getUserRoles(userId: number) {
    return encryptedApiClient.post<{
      success: boolean;
      data: UserRole[];
    }>('/rbac/users/roles/list', { userId });
  }

  static async removeRoleFromUser(userId: number, roleId: number) {
    return encryptedApiClient.post<{
      success: boolean;
      message: string;
    }>('/rbac/users/roles/remove', { userId, roleId });
  }

  static async listUsersWithRoles(filters: ListParams = {}) {
    return encryptedApiClient.post('/rbac/users/list-with-roles', filters);
  }

  // ==================== MENU PERMISSIONS ====================

  static async linkMenuPermission(payload: LinkMenuPermissionPayload) {
    return encryptedApiClient.post<{
      success: boolean;
      data: MenuPermission;
      message: string;
    }>('/rbac/menu-permissions/link', payload);
  }

  static async bulkLinkMenuPermissions(mappings: LinkMenuPermissionPayload[]) {
    return encryptedApiClient.post<{
      success: boolean;
      data: MenuPermission[];
      message: string;
      created: number;
      total: number;
    }>('/rbac/menu-permissions/bulk-link', { mappings });
  }

  static async unlinkMenuPermission(menuKey: string, permissionId: number) {
    return encryptedApiClient.post<{
      success: boolean;
      message: string;
    }>('/rbac/menu-permissions/unlink', { menuKey, permissionId });
  }

  static async getMenuPermissions(menuKey: string) {
    return encryptedApiClient.post<{ 
      success: boolean;
      data: MenuPermission[];
      message: string;
    }>('/rbac/menu-permissions/menu/get', { menuKey });
  }

  static async listMenuPermissions(params: ListMenuPermissionsParams = {}) {
    return encryptedApiClient.post<{
      success: boolean;
      data: {
        menuPermissionsList: MenuPermission[];
        meta: PaginationMeta;
      };
      message: string;
    }>('/rbac/menu-permissions/list', params);
  }

  // ==================== USER ACCESSIBLE MENUS ====================

  /**
   * CRITICAL: This endpoint is called on login to load menu permissions
   * Returns user's permissions and accessible menu keys
   * NO PERMISSION CHECK REQUIRED
   */
  static async getMyAccessibleMenus(): Promise<UserAccessibleMenusResponse> {
    return encryptedApiClient.post<UserAccessibleMenusResponse>(
      '/rbac/menu-permissions/my-access', 
      {}
    );
  }

  /**
   * Get another user's accessible menus (requires permission)
   */
  static async getUserAccessibleMenus(userId?: number): Promise<UserAccessibleMenusResponse> {
    return encryptedApiClient.post<UserAccessibleMenusResponse>(
      '/rbac/menu-permissions/user-access', 
      userId ? { userId } : {}
    );
  }

  /**
   * Check if current user can access a specific menu
   */
  static async checkMenuAccess(menuKey: string, userId?: number) {
    return encryptedApiClient.post<{
      success: boolean;
      data: {
        canAccess: boolean;
        menuKey: string;
        userId: string;
      };
      message: string;
    }>('/rbac/menu-permissions/check-access', { menuKey, userId });
  }

  // ==================== RESOURCE PERMISSIONS (SHARING) ====================

  static async grantResourcePermission(payload: GrantResourcePermissionPayload) {
    return encryptedApiClient.post('/rbac/resource-permissions/grant', payload);
  }

  static async revokeResourcePermission(payload: RevokeResourcePermissionPayload) {
    return encryptedApiClient.post('/rbac/resource-permissions/revoke', payload);
  }

  static async checkResourcePermission(payload: CheckResourcePermissionPayload) {
    return encryptedApiClient.post<{ 
      success: boolean;
      data: {
        hasPermission: boolean; 
        grantedBy: number | null; 
        expiresAt: string | null;
      };
    }>('/rbac/resource-permissions/check', payload);
  }

  static async checkBatchPermissions(checks: CheckResourcePermissionPayload[]) {
    return encryptedApiClient.post<{ 
      success: boolean;
      data: Array<CheckResourcePermissionPayload & { hasPermission: boolean }>;
    }>('/rbac/resource-permissions/check-batch', { checks });
  }

  static async listResourcePermissions(resourceType: string, resourceId: number) {
    return encryptedApiClient.post<{
      success: boolean;
      data: ResourcePermission[];
    }>('/rbac/resource-permissions/list', {
      resourceType,
      resourceId,
    });
  }

  static async checkAccess(payload: CheckAccessPayload) {
    return encryptedApiClient.post<{ 
      success: boolean;
      data: { hasAccess: boolean };
    }>('/rbac/permissions/access/check', payload);
  }

  // ==================== SHARING ====================

  static async createShare(payload: CreateSharePayload) {
    return encryptedApiClient.post<{
      success: boolean;
      data: ResourceShare;
    }>('/rbac/permissions/share/create', payload);
  }

  static async accessShare(payload: AccessSharePayload) {
    return encryptedApiClient.post('/rbac/permissions/share/access', payload);
  }

  static async revokeShare(shareId: number) {
    return encryptedApiClient.post('/rbac/permissions/share/revoke', { shareId });
  }

  static async listShares(resourceType: string, resourceId: number) {
    return encryptedApiClient.post<{
      success: boolean;
      data: ResourceShare[];
    }>('/rbac/permissions/share/list', {
      resourceType,
      resourceId,
    });
  }

  // ==================== DEPRECATED METHODS (Keep for backwards compatibility) ====================

  /**
   * @deprecated Use bulkAssignRolePermissions instead
   */
  static async assignPermissionsToRole(payload: AssignPermissionsPayload) {
    console.warn('⚠️ assignPermissionsToRole is deprecated. Use bulkAssignRolePermissions instead.');
    return encryptedApiClient.post('/rbac/roles/permissions/assign', payload);
  }

  /**
   * @deprecated Use getRolePermissionsTree instead
   */
  static async getRolePermissions(roleId: number) {
    console.warn('⚠️ getRolePermissions is deprecated. Use getRolePermissionsTree instead.');
    return encryptedApiClient.post<{
      data: Array<{
        role_permission_id: number;
        role_id: number;
        permission_id: number;
        permission_name: string;
        resource: string;
        action: string;
        category: string;
      }>;
    }>('/rbac/roles/permissions/list', { roleId });
  }

  /**
   * @deprecated Use bulkAssignRolePermissions instead
   */
  static async removePermissionFromRole(roleId: number, permissionId: number) {
    console.warn('⚠️ removePermissionFromRole is deprecated. Use bulkAssignRolePermissions instead.');
    return encryptedApiClient.post('/rbac/roles/permissions/remove', { roleId, permissionId });
  }
}