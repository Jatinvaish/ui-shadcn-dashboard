// lib/rbac-utils.ts - UPDATED

export interface Role {
  id: number;
  tenant_id?: number;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_default: boolean;
  hierarchy_level: number;
  created_at: string;
  updated_at?: string;
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

const getUserType = (user: any): string => {
  return user?.userType || user?.user_type || '';
};

export const canManageSystemResources = (userType: string): boolean => {
  return userType === 'super_admin' || userType === 'saas_admin';
};

export const canEditRole = (userType: string, role: Role): boolean => {
  if (canManageSystemResources(userType)) {
    return true;
  }

  if (role.is_system_role) {
    return false;
  }

  const userHierarchy = getUserHierarchyLevel(userType);
  return role.hierarchy_level > userHierarchy;
};

export const canDeleteRole = (userType: string, role: Role): boolean => {
  if (role.is_system_role) {
    return false;
  }

  if (canManageSystemResources(userType)) {
    return true;
  }

  const userHierarchy = getUserHierarchyLevel(userType);
  return role.hierarchy_level > userHierarchy;
};

export const canAssignPermission = (userType: string, permission: Permission): boolean => {
  if (canManageSystemResources(userType)) {
    return true;
  }

  if (permission.is_system_permission) {
    return false;
  }

  return true;
};

export const canAssignMenuPermission = (
  userType: string,
  userAccessibleMenus: string[],
  menuKey: string
): boolean => {
  if (canManageSystemResources(userType)) {
    return true;
  }

  return userAccessibleMenus.includes(menuKey);
};

export const filterAvailableRoles = (userType: string, roles: Role[]): Role[] => {
  if (canManageSystemResources(userType)) {
    return roles;
  }

  const userHierarchy = getUserHierarchyLevel(userType);
  return roles.filter(role => 
    !role.is_system_role && role.hierarchy_level > userHierarchy
  );
};

export const filterAvailablePermissions = (
  userType: string,
  userPermissions: Array<{ permission_key: string }>,
  allPermissions: Permission[]
): Permission[] => {
  if (canManageSystemResources(userType)) {
    return allPermissions;
  }

  const userPermissionKeys = new Set(userPermissions.map(p => p.permission_key));
  return allPermissions.filter(p => userPermissionKeys.has(p.permission_key));
};

export const filterAvailableMenus = (
  userType: string,
  userAccessibleMenus: string[],
  allMenuKeys: string[]
): string[] => {
  if (canManageSystemResources(userType)) {
    return allMenuKeys;
  }

  return allMenuKeys.filter(key => userAccessibleMenus.includes(key));
};

export const getUserHierarchyLevel = (userType: string): number => {
  const hierarchyMap: Record<string, number> = {
    super_admin: 0,
    saas_admin: 1,
    tenant_admin: 2,
    agency_admin: 3,
    brand_admin: 4,
    creator_admin: 5,
    user: 10,
  };

  return hierarchyMap[userType] ?? 100;
};

export const canManageUserRole = (
  managerUserType: string,
  targetRole: Role
): boolean => {
  if (canManageSystemResources(managerUserType)) {
    return true;
  }

  if (targetRole.is_system_role) {
    return false;
  }

  const managerHierarchy = getUserHierarchyLevel(managerUserType);
  return targetRole.hierarchy_level > managerHierarchy;
};

export const canViewResource = (
  userType: string,
  resourceType: 'role' | 'permission' | 'menu',
  resource: any
): boolean => {
  if (canManageSystemResources(userType)) {
    return true;
  }

  if (resourceType === 'role') {
    const role = resource as Role;
    if (role.is_system_role) return false;
    const userHierarchy = getUserHierarchyLevel(userType);
    return role.hierarchy_level > userHierarchy;
  }

  if (resourceType === 'permission') {
    const permission = resource as Permission;
    return !permission.is_system_permission;
  }

  return true;
};

export const validatePermissionAssignment = (
  assignerUserType: string,
  assignerPermissions: string[],
  permissionToAssign: string
): { valid: boolean; reason?: string } => {
  if (canManageSystemResources(assignerUserType)) {
    return { valid: true };
  }

  if (!assignerPermissions.includes(permissionToAssign)) {
    return {
      valid: false,
      reason: 'You can only assign permissions you have',
    };
  }

  return { valid: true };
};

export const validateRoleAssignment = (
  assignerUserType: string,
  roleToAssign: Role
): { valid: boolean; reason?: string } => {
  if (canManageSystemResources(assignerUserType)) {
    return { valid: true };
  }

  if (roleToAssign.is_system_role) {
    return {
      valid: false,
      reason: 'Only system administrators can assign system roles',
    };
  }

  const assignerHierarchy = getUserHierarchyLevel(assignerUserType);
  if (roleToAssign.hierarchy_level <= assignerHierarchy) {
    return {
      valid: false,
      reason: 'You can only assign roles with lower hierarchy than yours',
    };
  }

  return { valid: true };
};

export const getAssignableRoles = (
  userType: string,
  allRoles: Role[]
): Role[] => {
  if (canManageSystemResources(userType)) {
    return allRoles;
  }

  const userHierarchy = getUserHierarchyLevel(userType);
  return allRoles.filter(
    role => !role.is_system_role && role.hierarchy_level > userHierarchy
  );
};

export const getAssignablePermissions = (
  userType: string,
  userPermissions: string[],
  allPermissions: Permission[]
): Permission[] => {
  if (canManageSystemResources(userType)) {
    return allPermissions;
  }

  const userPermissionSet = new Set(userPermissions);
  return allPermissions.filter(p => userPermissionSet.has(p.permission_key));
};