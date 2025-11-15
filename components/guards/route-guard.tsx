// components/guards/route-guard.tsx - FIXED ACCESS CONTROL
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMenuPermissions } from '@/hooks/use-menu-permissions';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/forgot-password', 
  '/verify-email', '/sign-in', '/sign-up', '/errors'
];

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const { 
    canAccessRoute, 
    isInitialized, 
    loading,
    isSystemAdmin,
    blockedMenus
  } = useMenuPermissions();

  useEffect(() => {
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) return;
    if (!isInitialized || loading) return;
    if (isSystemAdmin) return;

    // Check blocked menus first
    const isBlocked = blockedMenus.some(blocked => {
      const menuKey = typeof blocked === 'string' ? blocked : blocked.menu_key;
      return pathname.includes(menuKey.replace(/\./g, '/'));
    });

    if (isBlocked) {
      console.warn('❌ Blocked menu access:', pathname);
      router.replace('/dashboard/errors/403');
      return;
    }

    // Check route access
    const hasAccess = canAccessRoute(pathname);
    if (!hasAccess) {
      console.warn('❌ No route access:', pathname);
      router.replace('/dashboard/errors/403');
      return;
    }
  }, [pathname, isInitialized, loading, canAccessRoute, isSystemAdmin, blockedMenus, router]);

  return <>{children}</>;
}