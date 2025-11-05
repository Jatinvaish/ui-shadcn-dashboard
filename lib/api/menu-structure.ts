// lib/api/menu-structure.ts - COMPLETE UPDATED VERSION
export interface MenuItem {
  key: string;
  title: string;
  icon: string;
  path: string;
  children?: MenuItem[];
  order: number;
  description?: string;
}

export const MENU_STRUCTURE: MenuItem[] = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    order: 1,
    description: 'Main dashboard overview'
  },
  {
    key: 'access-control',
    title: 'Access Control',
    icon: 'Shield',
    path: '/access-control',
    order: 2,
    description: 'RBAC and ABAC management',
    children: [
      {
        key: 'access-control.roles',
        title: 'Roles',
        icon: 'Shield',
        path: '/access-control/roles',
        order: 1,
        description: 'Manage system roles'
      },
      {
        key: 'access-control.permissions',
        title: 'Permissions',
        icon: 'Key',
        path: '/access-control/permissions',
        order: 2,
        description: 'Manage permissions'
      },
      {
        key: 'access-control.role-permissions',
        title: 'Role Permissions',
        icon: 'ShieldCheck',
        path: '/access-control/role-permissions',
        order: 3,
        description: 'Map permissions to roles'
      },
      {
        key: 'access-control.user-roles',
        title: 'User Roles',
        icon: 'UserCheck',
        path: '/access-control/user-roles',
        order: 4,
        description: 'Assign roles to users'
      },
      {
        key: 'access-control.menu-permissions',
        title: 'Menu Permissions',
        icon: 'Menu',
        path: '/access-control/menu-permissions',
        order: 5,
        description: 'Control menu visibility'
      },
      {
        key: 'access-control.attributes',
        title: 'ABAC Attributes',
        icon: 'Tag',
        path: '/access-control/attributes',
        order: 6,
        description: 'Attribute-based access control'
      },
      {
        key: 'access-control.policies',
        title: 'ABAC Policies',
        icon: 'FileText',
        path: '/access-control/policies',
        order: 7,
        description: 'Policy-based access control'
      },
      {
        key: 'access-control.policy-evaluation',
        title: 'Policy Evaluation',
        icon: 'CheckCircle',
        path: '/access-control/policy-evaluation',
        order: 8,
        description: 'Test and evaluate policies'
      },
      {
        key: 'access-control.resource-attributes',
        title: 'Resource Attributes',
        icon: 'Database',
        path: '/access-control/resource-attributes',
        order: 9,
        description: 'Manage resource attributes'
      }
    ]
  }
];

// Flatten menu structure recursively for easy lookup
const flattenMenuItems = (menus: MenuItem[]): MenuItem[] => {
  const flattened: MenuItem[] = [];
  
  const flatten = (items: MenuItem[]) => {
    items.forEach(item => {
      flattened.push(item);
      if (item.children && item.children.length > 0) {
        flatten(item.children);
      }
    });
  };
  
  flatten(menus);
  return flattened;
};

export const FLAT_MENU_ITEMS: MenuItem[] = flattenMenuItems(MENU_STRUCTURE);

// Helper functions
export const getMenuItemByKey = (key: string): MenuItem | undefined => {
  return FLAT_MENU_ITEMS.find(item => item.key === key);
};

export const getAllMenuKeys = (): string[] => {
  return FLAT_MENU_ITEMS.map(item => item.key);
};

export const getParentMenuKey = (key: string): string | null => {
  const parts = key.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : null;
};

export const getChildMenuKeys = (parentKey: string): string[] => {
  return FLAT_MENU_ITEMS
    .filter(item => item.key.startsWith(`${parentKey}.`) && item.key.split('.').length === parentKey.split('.').length + 1)
    .map(item => item.key);
};

// Get all children recursively (including nested)
export const getAllChildMenuKeys = (parentKey: string): string[] => {
  return FLAT_MENU_ITEMS
    .filter(item => item.key.startsWith(`${parentKey}.`) && item.key !== parentKey)
    .map(item => item.key);
};

// Check if a menu has children
export const hasChildren = (menuKey: string): boolean => {
  return FLAT_MENU_ITEMS.some(item => item.key.startsWith(`${menuKey}.`));
};