// ============================================
// FILE 5: hooks/use-menu-permissions.ts
// ============================================
'use client';

import { usePermissionContext } from '@/contexts/permission-context';

export function useMenuPermissions() {
  const context = usePermissionContext();
  
  return {
    isSystemAdmin: context.isSystemAdmin,
    hasWildcardAccess: context.accessibleMenus.includes('*'),
    accessibleMenus: context.accessibleMenus,
    userPermissions: context.userPermissions,
    blockedMenus: context.blockedMenus,
    isInitialized: context.isInitialized,
    loading: context.isLoading,
    canAccessMenu: context.canAccessMenu,
    canAccessRoute: context.canAccessRoute,
    hasPermission: context.hasPermission,
    hasAllPermissions: (keys: string[]) => keys.every(k => context.hasPermission(k)),
    hasAnyPermission: (keys: string[]) => keys.some(k => context.hasPermission(k)),
    refreshPermissions: context.refreshPermissions,
  };
}