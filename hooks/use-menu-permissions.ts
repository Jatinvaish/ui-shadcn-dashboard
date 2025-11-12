// hooks/use-menu-permissions.ts
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { isPublicRoute, getMenuKeyFromPathname } from '@/lib/route-menu-map';
import { selectAccessibleMenus, selectBlockedMenus, selectMenuPermissionsInitialized, selectMenuPermissionsLoading } from '@/store/slices/menu-permissions.slice';

export function useMenuPermissions() {
  const dispatch = useAppDispatch();
  const accessibleMenus = useAppSelector(selectAccessibleMenus);
  const blockedMenus = useAppSelector(selectBlockedMenus);
  const loading = useAppSelector(selectMenuPermissionsLoading);
  const isInitialized = useAppSelector(selectMenuPermissionsInitialized);

  /**
   * 🔒 Check if user can access a specific menu
   */
  const canAccessMenu = (menuKey: string): boolean => {
    if (!isInitialized) return false;
    return accessibleMenus.includes(menuKey);
  };

  /**
   * 🔒 Check if user can access a route (pathname)
   * ✅ FIXED: Now uses route-to-menu mapping
   */
  const canAccessRoute = (pathname: string): boolean => {
    // ✅ Public routes are always accessible
    if (isPublicRoute(pathname)) {
      return true;
    }

    // ✅ Get menu key from pathname
    const menuKey = getMenuKeyFromPathname(pathname);
    
    if (!menuKey) {
      // If no mapping exists, default to allowing access
      // (This handles unmapped routes gracefully)
      console.warn(`No menu mapping for route: ${pathname}`);
      return true;
    }

    return canAccessMenu(menuKey);
  };

  /**
   * Check if menu is blocked (has missing required permissions)
   */
  const isMenuBlocked = (menuKey: string): boolean => {
    return blockedMenus.some((blocked: any) => blocked.menu_key === menuKey);
  };

  /**
   * Get missing permissions for a menu
   */
  const getMissingPermissions = (menuKey: string): string[] => {
    const blocked = blockedMenus.find((b: any) => b.menu_key === menuKey);
    return blocked ? blocked.missing_permissions : [];
  };

  return {
    accessibleMenus,
    blockedMenus,
    loading,
    isInitialized,
    canAccessMenu,
    canAccessRoute, // ✅ FIXED
    isMenuBlocked,
    getMissingPermissions,
  };
}