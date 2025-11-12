// lib/constants/route-menu-map.ts
/**
 * 🎯 CRITICAL: Route-to-Menu Key Mapping
 * Maps Next.js routes to menu permission keys
 */
export const ROUTE_MENU_MAP: Record<string, string> = {
  // Dashboard
  '/dashboard': 'dashboard',
  
  // Access Control Module
  '/dashboard/access-control': 'access-control',
  '/dashboard/access-control/roles': 'access-control.roles',
  '/dashboard/access-control/roles/create': 'access-control.roles',
  '/dashboard/access-control/roles/[id]': 'access-control.roles',
  '/dashboard/access-control/roles/[id]/permissions': 'access-control.role-permissions',
  '/dashboard/access-control/permissions': 'access-control.permissions',
  '/dashboard/access-control/role-permissions': 'access-control.role-permissions',
  '/dashboard/access-control/user-roles': 'access-control.user-roles',
  '/dashboard/access-control/menu-permissions': 'access-control.menu-permissions',
  
  // Future modules (add as you build them)
  '/dashboard/campaigns': 'campaigns',
  '/dashboard/campaigns/list': 'campaigns.list',
  '/dashboard/campaigns/create': 'campaigns.create',
  '/dashboard/campaigns/[id]': 'campaigns.view',
  '/dashboard/content': 'content',
  '/dashboard/contracts': 'contracts',
  '/dashboard/chat': 'chat',
};

/**
 * Get menu key from pathname
 * Handles dynamic routes by replacing [id] with actual IDs
 */
export function getMenuKeyFromPathname(pathname: string): string | null {
  // Direct match
  if (ROUTE_MENU_MAP[pathname]) {
    return ROUTE_MENU_MAP[pathname];
  }

  // Handle dynamic routes: /dashboard/roles/123 -> /dashboard/roles/[id]
  for (const [route, menuKey] of Object.entries(ROUTE_MENU_MAP)) {
    if (route.includes('[')) {
      // Convert route pattern to regex
      const pattern = route
        .replace(/\[.*?\]/g, '[^/]+') // Replace [id] with number pattern
        .replace(/\//g, '\\/'); // Escape slashes
      
      const regex = new RegExp(`^${pattern}$`);
      
      if (regex.test(pathname)) {
        return menuKey;
      }
    }
  }

  return null;
}

/**
 * Check if route requires permission check
 * Public routes that don't require checks
 */
export const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/errors',
  '/403',
  '/404',
  '/500',
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}