// hooks/usePermissions.ts - FIXED & PRODUCTION READY
import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectUserPermissions,
  selectMenuPermissionsInitialized,
  selectMenuPermissionsLoadingAny,
} from '@/store/slices/menu-permissions.slice';
import { selectUser, selectUserType } from '@/store/slices/authSlice';

export function usePermissions() {
  const userType = useAppSelector(selectUserType);
  const userPermissions = useAppSelector(selectUserPermissions);
  const initialized = useAppSelector(selectMenuPermissionsInitialized);
  const loading = useAppSelector(selectMenuPermissionsLoadingAny);

  // Check if user is system admin
  const isSystemAdmin = useMemo(() => {
    return ['super_admin', 'saas_admin', 'owner'].includes(userType);
  }, [userType]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useMemo(() => {
    return (permissionKey: string): boolean => {
      if (!permissionKey) return false;
      
      // System admins have all permissions
      if (isSystemAdmin) {
        return true;
      }

      // Check if user has the permission
      return userPermissions.some(
        perm => perm.permission_key === permissionKey
      );
    };
  }, [userPermissions, isSystemAdmin]);

  /**
   * Check if user has all specified permissions
   */
  const hasAllPermissions = useMemo(() => {
    return (permissionKeys: string[]): boolean => {
      if (!permissionKeys || permissionKeys.length === 0) return true;
      
      // System admins have all permissions
      if (isSystemAdmin) {
        return true;
      }

      return permissionKeys.every(key => hasPermission(key));
    };
  }, [hasPermission, isSystemAdmin]);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useMemo(() => {
    return (permissionKeys: string[]): boolean => {
      if (!permissionKeys || permissionKeys.length === 0) return false;
      
      // System admins have all permissions
      if (isSystemAdmin) {
        return true;
      }

      return permissionKeys.some(key => hasPermission(key));
    };
  }, [hasPermission, isSystemAdmin]);

  /**
   * Check if user has permission by resource and action
   */
  const hasResourceAction = useMemo(() => {
    return (resource: string, action: string): boolean => {
      if (!resource || !action) return false;
      
      // System admins have all permissions
      if (isSystemAdmin) {
        return true;
      }

      const permissionKey = `${resource}:${action}`;
      return hasPermission(permissionKey);
    };
  }, [hasPermission, isSystemAdmin]);

  /**
   * Get user's permissions for a specific resource
   */
  const getResourcePermissions = useMemo(() => {
    return (resource: string): string[] => {
      if (!resource) return [];
      
      // System admins have all actions
      if (isSystemAdmin) {
        return ['read', 'write', 'create', 'delete', 'share'];
      }

      return userPermissions
        .filter(perm => perm.resource === resource)
        .map(perm => perm.action);
    };
  }, [userPermissions, isSystemAdmin]);

  /**
   * Get user's permissions by category
   */
  const getPermissionsByCategory = useMemo(() => {
    return (category: string) => {
      if (!category) return [];
      
      return userPermissions.filter(perm => perm.category === category);
    };
  }, [userPermissions]);

  /**
   * Get all user permission keys
   */
  const getAllPermissionKeys = useMemo(() => {
    return (): string[] => {
      return userPermissions.map(perm => perm.permission_key);
    };
  }, [userPermissions]);

  return {
    // State
    userPermissions,
    initialized,
    loading,
    isSystemAdmin,
    
    // Functions
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasResourceAction,
    getResourcePermissions,
    getPermissionsByCategory,
    getAllPermissionKeys,
  };
}

export default usePermissions;