
// hooks/usePermissions.ts - SIMPLIFIED (uses menu permissions hook)
"use client";

import { useMenuPermissions } from './use-menu-permissions';

export function usePermissions() {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    userPermissions,
    loading,
    isInitialized,
  } = useMenuPermissions();

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    userPermissions,
    loading,
    initialized: isInitialized,
  };
}
