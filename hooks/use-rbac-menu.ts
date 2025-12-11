// hooks/use-rbac-menu.tsx - ENHANCED VERSION
import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import {
  selectAccessibleMenus,
  selectMenuPermissionsInitialized,
  selectMenuPermissionsLoading,
} from '@/store/slices/menu-permissions.slice';
import { selectUser } from '@/store/slices/authSlice';
import { canManageSystemResources } from '@/lib/rbac-utils';
import { MENU_STRUCTURE } from '@/lib/api/menu-structure';
export function useRbacMenu() {
  const router = useRouter();
  const accessibleMenus = useAppSelector(selectAccessibleMenus);
  const isInitialized = useAppSelector(selectMenuPermissionsInitialized);
  const isLoading = useAppSelector(selectMenuPermissionsLoading);
  const currentUser = useAppSelector(selectUser);
  const userType = currentUser?.userType || currentUser?.user_type || '';
  const isSystemAdmin = canManageSystemResources(userType);
  // ✅ Memoized function to check menu access
  const canAccessMenu = useCallback(
    (menuKey: string): boolean => {
      if (!isInitialized) return false;
      // Super admins have access to everything
      if (isSystemAdmin) return true;

      // Check direct access
      if (accessibleMenus.includes(menuKey)) return true;

      // Check parent access (hierarchical)
      const parts = menuKey.split('.');
      for (let i = parts.length - 1; i > 0; i--) {
        const parentKey = parts.slice(0, i).join('.');
        if (accessibleMenus.includes(parentKey)) {
          return true;
        }
      }

      return false;
    },
    [accessibleMenus, isInitialized, isSystemAdmin]
  );
  // ✅ Filter menu structure based on access
  const menuStructure = useMemo(() => {
    if (!isInitialized) return [];
    return MENU_STRUCTURE.filter(menu => {
      // Check if user has access to this menu or any of its children
      if (canAccessMenu(menu.key)) return true;

      if (menu.children) {
        return menu.children.some(child => canAccessMenu(child.key));
      }

      return false;
    });
  }, [isInitialized, canAccessMenu]);
  // ✅ Navigate with permission check
  const navigateWithCheck = useCallback(
    (path: string, menuKey: string) => {
      if (!canAccessMenu(menuKey)) {
        router.push('/dashboard/errors/403');
        return;
      }
      router.push(path);
    },
    [canAccessMenu, router]
  );
  return {
    menuStructure,
    accessibleMenus,
    isLoading,
    isInitialized,
    isSystemAdmin,
    canAccessMenu,
    navigateWithCheck,
  };
}
