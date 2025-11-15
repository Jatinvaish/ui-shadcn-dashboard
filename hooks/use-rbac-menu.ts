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



// // ============================================
// // SNIPPET 4: hooks/use-rbac-menu.ts - FIXED VERSION
// // ============================================
// 'use client';

// import { useEffect, useState, useMemo } from 'react';
// import { useAppSelector } from '@/store/hooks';
// import { selectUser } from '@/store/slices/authSlice';
// import { 
//   selectAccessibleMenus,
//   selectUserPermissions,
//   selectMenuPermissionsInitialized,
//   selectMenuPermissionsLoading,
// } from '@/store/slices/menu-permissions.slice';
// import { canManageSystemResources } from '@/lib/rbac-utils';
// import { MENU_STRUCTURE, MenuItem } from '@/lib/api/menu-structure';
// import { usePathname, useRouter } from 'next/navigation';

// export function useRbacMenu() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const currentUser = useAppSelector(selectUser);
  
//   const accessibleMenus = useAppSelector(selectAccessibleMenus);
//   const userPermissions = useAppSelector(selectUserPermissions);
//   const isInitialized = useAppSelector(selectMenuPermissionsInitialized);
//   const isLoading = useAppSelector(selectMenuPermissionsLoading);

//   const userType = currentUser?.userType || currentUser?.user_type || '';
//   const isSystemAdmin = canManageSystemResources(userType);

//   // Filter menu structure based on access
//   const filteredMenuStructure = useMemo(() => {
//     if (!isInitialized) return [];
    
//     // ✅ Super admins see everything
//     if (isSystemAdmin) {
//       return MENU_STRUCTURE;
//     }

//     const filterMenus = (menus: MenuItem[]): MenuItem[] => {
//       return menus
//         .filter(menu => {
//           // ✅ ONLY show menus user has access to
//           const hasAccess = accessibleMenus.includes(menu.key);
          
//           // Check parent access
//           const parentKey = menu.key.split('.').slice(0, -1).join('.');
//           const hasParentAccess = parentKey && accessibleMenus.includes(parentKey);
          
//           return hasAccess || hasParentAccess;
//         })
//         .map(menu => {
//           if (menu.children && menu.children.length > 0) {
//             const filteredChildren = filterMenus(menu.children);
//             if (filteredChildren.length > 0) {
//               return { ...menu, children: filteredChildren };
//             }
//           }
//           return menu;
//         })
//         .filter(menu => {
//           // ✅ Remove parents with no accessible children
//           if (menu.children !== undefined) {
//             return menu.children.length > 0;
//           }
//           return true;
//         });
//     };

//     return filterMenus(MENU_STRUCTURE);
//   }, [isInitialized, accessibleMenus, isSystemAdmin]);

//   const canAccessMenu = (menuKey: string): boolean => {
//     if (!isInitialized) return false;
//     if (isSystemAdmin) return true;
//     if (accessibleMenus.includes(menuKey)) return true;
    
//     // Check parent access
//     const parts = menuKey.split('.');
//     for (let i = parts.length - 1; i > 0; i--) {
//       const parentKey = parts.slice(0, i).join('.');
//       if (accessibleMenus.includes(parentKey)) return true;
//     }
    
//     return false;
//   };

//   const getCurrentMenuKey = (): string | null => {
//     const cleanPath = pathname.replace(/\/$/, '');
    
//     const routeMap: Record<string, string> = {
//       '/dashboard': 'dashboard',
//       '/dashboard/access-control': 'access-control',
//       '/dashboard/access-control/roles': 'access-control.roles',
//       '/dashboard/access-control/permissions': 'access-control.permissions',
//       '/dashboard/access-control/menu-permissions': 'access-control.menu-permissions',
//       '/dashboard/access-control/user-roles': 'access-control.user-roles',
//       '/dashboard/access-control/role-permissions': 'access-control.role-permissions',
//     };

//     if (routeMap[cleanPath]) return routeMap[cleanPath];

//     for (const [route, menuKey] of Object.entries(routeMap)) {
//       if (cleanPath.startsWith(route + '/')) return menuKey;
//     }

//     return null;
//   };

//   const canAccessCurrentRoute = (): boolean => {
//     const menuKey = getCurrentMenuKey();
//     if (!menuKey) return true;
//     return canAccessMenu(menuKey);
//   };

//   const navigateWithCheck = (path: string, menuKey: string) => {
//     if (canAccessMenu(menuKey)) {
//       router.push(path);
//     } else {
//       console.warn(`Access denied to menu: ${menuKey}`);
//       router.push('/dashboard/errors/403');
//     }
//   };

//   const hasPermission = (permissionKey: string): boolean => {
//     if (!isInitialized) return false;
//     if (isSystemAdmin) return true;
//     return userPermissions.some(p => p.permission_key === permissionKey);
//   };

//   return {
//     isLoading,
//     isInitialized,
//     userType,
//     menuStructure: filteredMenuStructure,
//     accessibleMenus,
//     canAccessMenu,
//     canAccessCurrentRoute,
//     hasPermission,
//     getCurrentMenuKey,
//     navigateWithCheck,
//     isSystemAdmin,
//   };
// }