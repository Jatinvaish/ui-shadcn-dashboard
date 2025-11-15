// hooks/use-menu-permissions.ts - FIXED & PRODUCTION READY
import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchMyAccessibleMenus,
  selectAccessibleMenus,
  selectUserPermissions,
  selectBlockedMenus,
  selectMenuPermissionsInitialized,
  selectMenuPermissionsLoadingAny,
  selectMenuPermissionsError,
} from '@/store/slices/menu-permissions.slice';
import { selectUser, selectIsAuthenticated, selectUserType } from '@/store/slices/authSlice';
import { getMenuKeyFromRoute, getAllParentMenuKeys } from '@/lib/route-menu-map';

export function useMenuPermissions() {
  const dispatch = useAppDispatch();
  
  // Auth state
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userType = useAppSelector(selectUserType);
  
  // Menu permissions state
  const accessibleMenus = useAppSelector(selectAccessibleMenus);
  const userPermissions = useAppSelector(selectUserPermissions);
  const blockedMenus = useAppSelector(selectBlockedMenus);
  const isInitialized = useAppSelector(selectMenuPermissionsInitialized);
  const loading = useAppSelector(selectMenuPermissionsLoadingAny);
  const error = useAppSelector(selectMenuPermissionsError);

  // Check if user is system admin
  const isSystemAdmin = useMemo(() => {
    return ['super_admin', 'saas_admin', 'owner'].includes(userType);
  }, [userType]);

  // Load menu permissions on mount if authenticated and not initialized
  useEffect(() => {
    if (isAuthenticated && !isInitialized && !loading && user?.id) {
      console.log('🔄 Loading menu permissions for user:', user.id);
      dispatch(fetchMyAccessibleMenus());
    }
  }, [isAuthenticated, isInitialized, loading, user?.id, dispatch]);

  /**
   * Check if user can access a specific menu
   */
  const canAccessMenu = useMemo(() => {
    return (menuKey: string): boolean => {
      if (!menuKey) return false;
      
      // System admins have access to everything
      if (isSystemAdmin) {
        return true;
      }

      // Check if menu is in accessible list
      if (accessibleMenus.includes(menuKey)) {
        return true;
      }

      // Check if menu is explicitly blocked
      if (blockedMenus.includes(menuKey)) {
        return false;
      }

      // Check parent menus - if any parent is accessible, child should be accessible
      const parentKeys = getAllParentMenuKeys(menuKey);
      return parentKeys.some(parentKey => accessibleMenus.includes(parentKey));
    };
  }, [accessibleMenus, blockedMenus, isSystemAdmin]);

  /**
   * Check if user can access a route
   */
  const canAccessRoute = useMemo(() => {
    return (pathname: string): boolean => {
      if (!pathname) return false;
      
      // System admins have access to all routes
      if (isSystemAdmin) {
        return true;
      }

      // Get menu key from route
      const menuKey = getMenuKeyFromRoute(pathname);
      
      if (!menuKey) {
        // If no menu key found, allow access (could be a dynamic route)
        return true;
      }

      return canAccessMenu(menuKey);
    };
  }, [canAccessMenu, isSystemAdmin]);

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
   * Get list of accessible menu keys
   */
  const getAccessibleMenus = useMemo(() => {
    return (): string[] => {
      if (isSystemAdmin) {
        // Return all menu keys for system admin
        return [];
      }
      return accessibleMenus;
    };
  }, [accessibleMenus, isSystemAdmin]);

  /**
   * Get list of blocked menu keys
   */
  const getBlockedMenus = useMemo(() => {
    return (): string[] => {
      if (isSystemAdmin) {
        return [];
      }
      return blockedMenus;
    };
  }, [blockedMenus, isSystemAdmin]);

  /**
   * Check if menu permissions are loaded
   */
  const isLoaded = useMemo(() => {
    return isInitialized && !loading;
  }, [isInitialized, loading]);

  return {
    // State
    accessibleMenus,
    userPermissions,
    blockedMenus,
    isInitialized,
    loading,
    error,
    isLoaded,
    isSystemAdmin,
    userType,
    
    // Functions
    canAccessMenu,
    canAccessRoute,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getAccessibleMenus,
    getBlockedMenus,
    
    // Refresh function
    refresh: () => dispatch(fetchMyAccessibleMenus()),
  };
}

export default useMenuPermissions;