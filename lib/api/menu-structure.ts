// config/menu-structure.ts - MENU DEFINITION
export const MENU_STRUCTURE = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    order: 1,
  },
  {
    key: 'access-control',
    title: 'Access Control',
    icon: 'Shield',
    path: '/dashboard/access-control',
    order: 2,
    children: [
      {
        key: 'access-control.roles',
        title: 'Roles',
        icon: 'Shield',
        path: '/dashboard/access-control/roles',
        order: 1,
      },
      {
        key: 'access-control.permissions',
        title: 'Permissions',
        icon: 'Key',
        path: '/dashboard/access-control/permissions',
        order: 2,
      },
      {
        key: 'access-control.role-permissions',
        title: 'Role Permissions',
        icon: 'ShieldCheck',
        path: '/dashboard/access-control/role-permissions',
        order: 3,
      },
      {
        key: 'access-control.user-roles',
        title: 'User Roles',
        icon: 'UserCheck',
        path: '/dashboard/access-control/user-roles',
        order: 4,
      },
      {
        key: 'access-control.menu-permissions',
        title: 'Menu Permissions',
        icon: 'Menu',
        path: '/dashboard/access-control/menu-permissions',
        order: 5,
      },
    ],
  },
];

// // ============================================
// // FILE 4: lib/api/menu-structure.ts - PRODUCTION
// // ============================================
// export interface MenuItem {
//   key: string;
//   title: string;
//   icon: string;
//   path: string;
//   order: number;
//   description?: string;
//   children?: MenuItem[];
// }

// export const MENU_STRUCTURE: MenuItem[] = [
//   {
//     key: 'dashboard',
//     title: 'Dashboard',
//     icon: 'LayoutDashboard',
//     path: '/dashboard',
//     order: 1,
//     description: 'Main dashboard overview'
//   },
//   {
//     key: 'access-control',
//     title: 'Access Control',
//     icon: 'Shield',
//     path: '/dashboard/access-control',
//     order: 2,
//     description: 'RBAC and permissions management',
//     children: [
//       {
//         key: 'access-control.roles',
//         title: 'Roles',
//         icon: 'Shield',
//         path: '/dashboard/access-control/roles',
//         order: 1,
//         description: 'Manage system roles'
//       },
//       {
//         key: 'access-control.permissions',
//         title: 'Permissions',
//         icon: 'Key',
//         path: '/dashboard/access-control/permissions',
//         order: 2,
//         description: 'Manage permissions'
//       },
//       {
//         key: 'access-control.role-permissions',
//         title: 'Role Permissions',
//         icon: 'ShieldCheck',
//         path: '/dashboard/access-control/role-permissions',
//         order: 3,
//         description: 'Map permissions to roles'
//       },
//       {
//         key: 'access-control.user-roles',
//         title: 'User Roles',
//         icon: 'UserCheck',
//         path: '/dashboard/access-control/user-roles',
//         order: 4,
//         description: 'Assign roles to users'
//       },
//       {
//         key: 'access-control.menu-permissions',
//         title: 'Menu Permissions',
//         icon: 'Menu',
//         path: '/dashboard/access-control/menu-permissions',
//         order: 5,
//         description: 'Control menu visibility'
//       }
//     ]
//   }
// ];

// const flattenMenuItems = (menus: MenuItem[]): MenuItem[] => {
//   const flattened: MenuItem[] = [];
//   const flatten = (items: MenuItem[]) => {
//     items.forEach(item => {
//       flattened.push(item);
//       if (item.children && item.children.length > 0) {
//         flatten(item.children);
//       }
//     });
//   };
//   flatten(menus);
//   return flattened;
// };

// export const FLAT_MENU_ITEMS: MenuItem[] = flattenMenuItems(MENU_STRUCTURE);

// export const getMenuItemByKey = (key: string): MenuItem | undefined => {
//   return FLAT_MENU_ITEMS.find(item => item.key === key);
// };

// export const getAllMenuKeys = (): string[] => {
//   return FLAT_MENU_ITEMS.map(item => item.key);
// };