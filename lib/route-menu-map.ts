// lib/route-menu-map.ts - PRODUCTION READY WITH FIX

/**
 * Mapping of routes to menu keys for access control
 * This allows the system to check menu permissions based on the current route
 */
export const ROUTE_MENU_MAP: Record<string, string> = {
  // Dashboard
  '/dashboard': 'dashboard',
  '/dashboard/default': 'dashboards',
  '/dashboard/ecommerce': 'dashboards.ecommerce',
  '/dashboard/sales': 'dashboards.sales',
  '/dashboard/crm': 'dashboards.crm',
  '/dashboard/analytics': 'dashboards.analytics',
  '/dashboard/chat': 'chat.access',
  
  // Access Control
  '/dashboard/access-control': 'access-control',
  '/dashboard/access-control/roles': 'access-control.roles',
  '/dashboard/access-control/permissions': 'access-control.permissions',
  '/dashboard/access-control/menu-permissions': 'access-control.menu-permissions',
  '/dashboard/access-control/user-roles': 'access-control.user-roles',
  '/dashboard/access-control/role-permissions': 'access-control.role-permissions',
     '/dashboard/access-control/resource-attributes': 'access-control.resource-attributes',
  
  // Apps
  '/dashboard/apps/chat': 'apps.chat',
  '/dashboard/apps/kanban': 'apps.kanban',
  '/dashboard/apps/notes': 'apps.notes',
  '/dashboard/apps/mail': 'apps.mail',
  '/dashboard/apps/calendar': 'apps.calendar',
  '/dashboard/apps/tasks': 'apps.tasks',
  '/dashboard/apps/todo-list-app': 'apps.todo-list',
  '/dashboard/apps/file-manager': 'apps.file-manager',
  '/dashboard/apps/api-keys': 'apps.api-keys',
  
  // AI Apps
  '/dashboard/apps/ai-chat': 'ai-apps.chat',
  '/dashboard/apps/ai-chat-v2': 'ai-apps.chat-v2',
  '/dashboard/apps/ai-image-generator': 'ai-apps.image-generator',
  '/dashboard/apps/text-to-speech': 'ai-apps.text-to-speech',
  
  // Pages
  '/dashboard/pages/users': 'pages.users',
  '/dashboard/pages/profile': 'pages.profile',
  '/dashboard/pages/settings': 'pages.settings',
  '/dashboard/pages/pricing': 'pages.pricing',
  '/dashboard/pages/onboarding-flow': 'pages.onboarding',
  '/dashboard/pages/empty-states': 'pages.empty-states',
};

/**
 * Public routes that don't require authentication
 * These routes are accessible without login
 */
export const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/verify-email',
  '/auth',
  '/errors/403',
  '/errors/404',
  '/errors/500',
  '/_next',
  '/api',
  '/static',
];

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  // Remove trailing slash for consistent matching
  const cleanPath = pathname.replace(/\/$/, '');
  
  return PUBLIC_ROUTES.some(route => {
    // Exact match
    if (cleanPath === route) return true;
    
    // Prefix match (for routes like /api/*, /errors/*)
    if (cleanPath.startsWith(route + '/')) return true;
    
    return false;
  });
}

/**
 * Get menu key from pathname
 * Handles dynamic routes like /dashboard/access-control/roles/123
 */
export function getMenuKeyFromRoute(pathname: string): string | null {
  // Remove trailing slash
  const cleanPath = pathname.replace(/\/$/, '');
  
  // Check for exact match first
  if (ROUTE_MENU_MAP[cleanPath]) {
    console.log('🔍 Exact match:', cleanPath, '->', ROUTE_MENU_MAP[cleanPath]);
    return ROUTE_MENU_MAP[cleanPath];
  }

  // Handle dynamic routes by checking prefixes
  // Sort routes by length (longest first) to match most specific routes first
  const sortedRoutes = Object.entries(ROUTE_MENU_MAP)
    .sort(([a], [b]) => b.length - a.length);

  for (const [route, menuKey] of sortedRoutes) {
    if (cleanPath.startsWith(route + '/') || cleanPath === route) {
      console.log('🔍 Prefix match:', cleanPath, '->', menuKey, 'via', route);
      return menuKey;
    }
  }

  // Fallback: try to derive from path
  const pathParts = cleanPath.split('/').filter(Boolean);
  if (pathParts.length > 1 && pathParts[0] === 'dashboard') {
    // Convert /dashboard/access-control/roles to access-control.roles
    const derivedKey = pathParts.slice(1).join('.');
    console.log('🔍 Derived key:', cleanPath, '->', derivedKey);
    return derivedKey;
  }

  console.warn('⚠️ No menu key found for:', cleanPath);
  return null;
}

/**
 * Get parent menu key from a menu key
 * e.g., 'access-control.roles' -> 'access-control'
 */
export function getParentMenuKey(menuKey: string): string | null {
  const parts = menuKey.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : null;
}

/**
 * Get all parent menu keys (from immediate parent to root)
 * e.g., 'access-control.roles.edit' -> ['access-control.roles', 'access-control']
 */
export function getAllParentMenuKeys(menuKey: string): string[] {
  const parts = menuKey.split('.');
  const parents: string[] = [];
  
  // Start from length-1 to get immediate parent first
  for (let i = parts.length - 1; i > 0; i--) {
    parents.push(parts.slice(0, i).join('.'));
  }
  
  return parents;
}

/**
 * Check if a menu key is a child of another menu key
 * e.g., 'access-control.roles' is child of 'access-control'
 */
export function isChildMenu(childKey: string, parentKey: string): boolean {
  return childKey.startsWith(parentKey + '.');
}

/**
 * Get all child menu keys for a parent
 * e.g., 'access-control' -> ['access-control.roles', 'access-control.permissions', ...]
 */
export function getChildMenuKeys(parentKey: string, allMenuKeys: string[]): string[] {
  return allMenuKeys.filter(key => isChildMenu(key, parentKey));
}