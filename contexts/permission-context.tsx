// contexts/permission-context.tsx - FIXED WITH getMyAccessibleMenus
'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser, selectUserType, selectIsAuthenticated } from '@/store/slices/authSlice';
import {
  fetchMyAccessibleMenus,
  selectAccessibleMenus,
  selectUserPermissions,
  selectBlockedMenus,
  selectMenuPermissionsInitialized,
  selectMenuPermissionsLoadingAny,
} from '@/store/slices/menu-permissions.slice';
import { getMenuKeyFromRoute, getAllParentMenuKeys, isPublicRoute } from '@/lib/route-menu-map';

interface PermissionContextType {
  isLoading: boolean;
  isInitialized: boolean;
  canAccessMenu: (menuKey: string) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  hasPermission: (permissionKey: string) => boolean;
  accessibleMenus: string[];
  blockedMenus: any[];
  userPermissions: any[];
  isSystemAdmin: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  
  const user = useAppSelector(selectUser);
  const userType = useAppSelector(selectUserType);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessibleMenus = useAppSelector(selectAccessibleMenus);
  const userPermissions = useAppSelector(selectUserPermissions);
  const blockedMenus = useAppSelector(selectBlockedMenus);
  const storeInitialized = useAppSelector(selectMenuPermissionsInitialized);
  const storeLoading = useAppSelector(selectMenuPermissionsLoadingAny);

  const [ready, setReady] = useState(false);
  const loadAttemptedRef = useRef(false);
  const loadingRef = useRef(false);
  const lastCheckedPathRef = useRef('');

  const isSystemAdmin = userType === 'super_admin' || userType === 'saas_admin';

  // Load permissions using fetchMyAccessibleMenus thunk
  const loadPermissions = useCallback(async () => {
    if (loadingRef.current) {
      console.log('⏸️ Already loading permissions');
      return;
    }

    loadingRef.current = true;
    console.log('🔄 Calling fetchMyAccessibleMenus...');

    try {
      const result = await dispatch(fetchMyAccessibleMenus()).unwrap();
      console.log('✅ getMyAccessibleMenus response:', {
        accessibleMenus: result.accessibleMenus?.length || 0,
        blockedMenus: result.blockedMenus?.length || 0,
        userPermissions: result.userPermissions?.length || 0,
      });
    } catch (error: any) { 
      console.error('❌ getMyAccessibleMenus error:', error);
    } finally {
      loadingRef.current = false;
      loadAttemptedRef.current = true;
      setReady(true);
    }
  }, [dispatch]);

  // Check if menu is blocked
  const isMenuBlocked = useCallback((menuKey: string): boolean => {
    const blocked = blockedMenus.some((item: any) => {
      const key = typeof item === 'string' ? item : item?.menu_key;
      return key === menuKey;
    });
    
    if (blocked) {
      console.log('🚫 Menu blocked:', menuKey);
    }
    
    return blocked;
  }, [blockedMenus]);

  // Check menu access
  const canAccessMenu = useCallback((menuKey: string): boolean => {
    if (!menuKey) {
      console.warn('⚠️ Empty menu key');
      return false;
    }
    
    // System admin bypass
    if (isSystemAdmin) {
      console.log('✅ System admin access:', menuKey);
      return true;
    }
    
    // Check if blocked (priority check)
    if (isMenuBlocked(menuKey)) {
      console.log('🚫 Access blocked:', menuKey);
      return false;
    }
    
    // Check direct access
    if (accessibleMenus.includes(menuKey)) {
      console.log('✅ Direct access:', menuKey);
      return true;
    }

    // Check parent access
    const parentKeys = getAllParentMenuKeys(menuKey);
    const hasParentAccess = parentKeys.some(parentKey => accessibleMenus.includes(parentKey));
    
    if (hasParentAccess) {
      console.log('✅ Parent access:', menuKey);
    } else {
      console.log('❌ No access:', menuKey, { 
        accessible: accessibleMenus,
        parents: parentKeys 
      });
    }
    
    return hasParentAccess;
  }, [isSystemAdmin, accessibleMenus, isMenuBlocked]);

  // Check route access
  const canAccessRoute = useCallback((pathname: string): boolean => {
    if (isPublicRoute(pathname)) {
      console.log('✅ Public route:', pathname);
      return true;
    }
    
    if (isSystemAdmin) {
      console.log('✅ System admin route access:', pathname);
      return true;
    }
    
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      console.log('✅ Dashboard home access');
      return true;
    }

    const menuKey = getMenuKeyFromRoute(pathname);
    if (!menuKey) {
      console.warn('⚠️ No menu key for route:', pathname);
      return true; // Allow if no mapping found
    }

    const hasAccess = canAccessMenu(menuKey);
    console.log('🔍 Route access check:', { 
      pathname, 
      menuKey, 
      hasAccess,
      blockedCount: blockedMenus.length,
      accessibleCount: accessibleMenus.length
    });
    
    return hasAccess;
  }, [isSystemAdmin, canAccessMenu]);

  // Check permission
  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (!permissionKey) return false;
    if (isSystemAdmin) return true;
    return userPermissions.some(perm => perm.permission_key === permissionKey);
  }, [isSystemAdmin, userPermissions]);

  // Manual refresh
  const refreshPermissions = useCallback(async () => {
    console.log('🔄 Manual refresh requested');
    loadAttemptedRef.current = false;
    setReady(false);
    await loadPermissions();
  }, [loadPermissions]);

  // EFFECT 1: Initial load
  useEffect(() => {
    console.log('🎯 Permission context mount:', { 
      isAuthenticated, 
      hasUser: !!user, 
      pathname,
      loadAttempted: loadAttemptedRef.current,
      storeInitialized,
    });

    // Public routes - ready immediately
    if (isPublicRoute(pathname)) {
      console.log('✅ Public route - ready');
      setReady(true);
      return;
    }

    // Not authenticated - ready immediately
    if (!isAuthenticated || !user) {
      console.log('⚠️ Not authenticated - ready');
      setReady(true);
      return;
    }

    // Already loaded and store is initialized
    if (loadAttemptedRef.current && storeInitialized) {
      console.log('✅ Already loaded');
      setReady(true);
      return;
    }

    // Load permissions
    console.log('🔄 Loading permissions...');
    loadPermissions();
  }, [isAuthenticated, user, pathname, storeInitialized, loadPermissions]);

  // EFFECT 2: Route access check
  useEffect(() => {
    if (!ready) {
      console.log('⏳ Not ready yet');
      return;
    }

    if (isPublicRoute(pathname)) {
      return;
    }

    if (!isAuthenticated || !user) {
      return;
    }

    // Prevent duplicate checks
    if (pathname === lastCheckedPathRef.current) {
      return;
    }

    lastCheckedPathRef.current = pathname;

    // System admin bypass
    if (isSystemAdmin) {
      console.log('✅ System admin bypass');
      return;
    }

    // Check access
    const hasAccess = canAccessRoute(pathname);
    
    if (!hasAccess) {
      console.warn('🚫 ACCESS DENIED:', pathname);
      console.log('📊 State:', {
        accessibleMenus,
        blockedMenus,
        userPermissions: userPermissions.length,
      });
      router.replace('/dashboard/errors/403');
      return;
    }

    console.log('✅ ACCESS GRANTED:', pathname);
  }, [pathname, ready, isAuthenticated, user, isSystemAdmin, canAccessRoute, router, accessibleMenus, blockedMenus, userPermissions]);

  // Compute loading states
  const isLoading = !ready || storeLoading;
  const isInitialized = ready && storeInitialized;

  console.log('📊 Context state:', { 
    ready, 
    storeLoading, 
    storeInitialized, 
    isLoading, 
    isInitialized,
    accessibleCount: accessibleMenus.length,
    blockedCount: blockedMenus.length,
  });

  const value: PermissionContextType = {
    isLoading,
    isInitialized,
    canAccessMenu,
    canAccessRoute,
    hasPermission,
    accessibleMenus,
    blockedMenus,
    userPermissions,
    isSystemAdmin,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within PermissionProvider');
  }
  return context;
}