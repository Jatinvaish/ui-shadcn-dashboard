
// hooks/use-menu-permissions.ts - FIXED FOR BACKEND RESPONSE
"use client";

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchMyAccessibleMenus,
  selectUserPermissions,
  selectAccessibleMenus,
  selectBlockedMenus,
  selectMenuPermissionsLoading,
  selectMenuPermissionsInitialized,
} from '@/store/slices/menu-permissions.slice';
import { MenuItem } from '@/lib/api/menu-structure';

export function useMenuPermissions() {
  const dispatch = useAppDispatch();
  const userPermissions = useAppSelector(selectUserPermissions);
  const accessibleMenus = useAppSelector(selectAccessibleMenus);
  const blockedMenus = useAppSelector(selectBlockedMenus);
  const loading = useAppSelector(selectMenuPermissionsLoading);
  const isInitialized = useAppSelector(selectMenuPermissionsInitialized);

  useEffect(() => {
    if (!isInitialized && !loading) {
      dispatch(fetchMyAccessibleMenus());
    }
  }, [dispatch, isInitialized, loading]);

  /**
   * Check if user can access a menu by its key
   * Also checks parent menus for hierarchical access
   * 
   * Examples:
   * - canAccessMenu('access-control.roles') checks both 'access-control.roles' and 'access-control'
   * - canAccessMenu('access-control') checks only 'access-control'
   */
  const canAccessMenu = (menuKey: string): boolean => {
    if (!isInitialized) return false;
    
    // If no menu restrictions, allow access
    if (accessibleMenus.length === 0 && blockedMenus.length === 0) {
      return true;
    }

    // If explicitly blocked, deny access
    if (blockedMenus.includes(menuKey)) {
      return false;
    }

    // Check if menu or any parent is accessible
    const menuParts = menuKey.split('.');
    for (let i = menuParts.length; i > 0; i--) {
      const checkKey = menuParts.slice(0, i).join('.');
      if (accessibleMenus.includes(checkKey)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Check if user can access a route path
   * Handles dynamic routes like /roles/123/manage-permissions
   */
  const canAccessRoute = (pathname: string): boolean => {
    if (!isInitialized) return false;

    // Remove leading/trailing slashes and split
    const pathSegments = pathname.replace(/^\/|\/$/g, '').split('/');
    
    // Build possible menu keys from path
    // Example: /access-control/roles/123/manage-permissions
    // Checks: access-control.roles.manage-permissions, access-control.roles, access-control
    const possibleKeys: string[] = [];
    
    // Full path (excluding numeric IDs)
    const filteredSegments = pathSegments.filter(seg => !/^\d+$/.test(seg));
    for (let i = filteredSegments.length; i > 0; i--) {
      possibleKeys.push(filteredSegments.slice(0, i).join('.'));
    }

    // Check if any possible key grants access
    return possibleKeys.some(key => canAccessMenu(key));
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permissionName: string): boolean => {
    return userPermissions.includes(permissionName);
  };

  /**
   * Check if user has all specified permissions
   */
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(perm => userPermissions.includes(perm));
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(perm => userPermissions.includes(perm));
  };

  /**
   * Build accessible menu tree from menu structure
   * Filters menus based on user's accessible menu keys
   */
  const buildAccessibleMenuTree = (): MenuItem[] => {
    if (!isInitialized || accessibleMenus.length === 0) {
      return [];
    }

    const filterMenus = (menus: MenuItem[]): MenuItem[] => {
      return menus
        .filter(menu => canAccessMenu(menu.key))
        .map(menu => ({
          ...menu,
          children: menu.children ? filterMenus(menu.children) : undefined
        }));
    };

    // Import menu structure dynamically to avoid circular dependencies
    // For now, return empty array - you'll need to pass MENU_STRUCTURE from component
    return [];
  };

  return {
    // Menu access
    canAccessMenu,
    canAccessRoute,
    accessibleMenuKeys: accessibleMenus,
    blockedMenuKeys: blockedMenus,
    accessibleMenuTree: [], // Deprecated - build in component instead
    
    // Permission checks
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    userPermissions,
    
    // State
    loading,
    isInitialized,
    
    // Legacy support
    selectedMenuKey: '',
    selectMenu: () => {},
    error: null,
  };
}
