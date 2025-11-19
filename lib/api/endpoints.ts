// lib/api/endpoints.ts - UPDATED TO MATCH BACKEND

export const API_ENDPOINTS = {
  // ==================== AUTH ====================
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY_REGISTRATION: '/auth/verify-registration',
    RESEND_VERIFICATION: '/auth/resend-verification',
    REFRESH_TOKEN: '/auth/refresh',
    ME: '/auth/me',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm',
    CREATE_AGENCY: '/auth/create-agency',
    CREATE_BRAND: '/auth/create-brand',
    CREATE_CREATOR: '/auth/create-creator',
    SESSIONS: '/auth/sessions',
  },

  // ==================== TENANTS ====================
  TENANTS: {
    MY_TENANTS: '/tenants/my-tenants',
    GET: (id: string) => `/tenants/${id}`,
    UPDATE: (id: string) => `/tenants/${id}`,
    MEMBERS: (id: string) => `/tenants/${id}/members`,
    USAGE: (id: string) => `/tenants/${id}/usage`,
  },

  // ==================== RBAC ====================
  RBAC: {
    ROLES: {
      LIST: '/rbac/roles/list',
      GET: '/rbac/roles/get',
      CREATE: '/rbac/roles/create',
      UPDATE: '/rbac/roles/update',
      DELETE: '/rbac/roles/delete',
    },

    PERMISSIONS: {
      LIST: '/rbac/permissions/list',
      GET: '/rbac/permissions/get',
      CREATE: '/rbac/permissions/create',
      DELETE: '/rbac/permissions/delete',
      ASSIGNABLE: '/rbac/permissions/assignable', // ✅ ADD THIS
    },

    ROLE_PERMISSIONS: {
      TREE: '/rbac/roles/permissions/tree',
      ASSIGN: '/rbac/roles/permissions/assign',
      BULK_ASSIGN: '/rbac/roles/permissions/bulk-assign',
      REMOVE: '/rbac/roles/permissions/remove',
    },

    USER_ROLES: {
      LIST: '/rbac/users/roles/list',
      ASSIGN: '/rbac/users/roles/assign',
      REMOVE: '/rbac/users/roles/remove',
      EFFECTIVE_PERMISSIONS: '/rbac/users/permissions/effective',
    },

    MENU_PERMISSIONS: {
      LINK: '/rbac/menu-permissions/link',
      BULK_LINK: '/rbac/menu-permissions/bulk-link',
      UNLINK: '/rbac/menu-permissions/unlink',
      MENU_GET: '/rbac/menu-permissions/menu/get',
      LIST: '/rbac/menu-permissions/list',
      USER_ACCESS: '/rbac/menu-permissions/user-access',
      MY_ACCESS: '/rbac/menu-permissions/my-access',
      CHECK_ACCESS: '/rbac/menu-permissions/check-access',
    },

    RESOURCE_PERMISSIONS: {
      GRANT: '/rbac/resource-permissions/grant',
      REVOKE: '/rbac/resource-permissions/revoke',
      CHECK: '/rbac/resource-permissions/check',
      CHECK_BATCH: '/rbac/resource-permissions/check-batch',
      LIST: '/rbac/resource-permissions/list',
    },

    ROLE_LIMITS: {
      CREATE: '/rbac/role-limits/create',
      UPDATE: '/rbac/role-limits/update',
      GET: '/rbac/role-limits/get',
    },

    ENHANCED: {
      BULK_ASSIGN_ROLES: '/rbac/users/roles/bulk-assign',
      BULK_REMOVE_ROLES: '/rbac/users/roles/bulk-remove',
      BULK_ASSIGN_USERS: '/rbac/roles/users/bulk-assign',
      CLONE_ROLE: '/rbac/roles/clone',
      COMPARE_ROLES: '/rbac/roles/compare',
      SEARCH_PERMISSIONS: '/rbac/permissions/search',
      AVAILABLE_PERMISSIONS: '/rbac/permissions/available',
      MENU_HIERARCHY: '/rbac/menu-permissions/hierarchy',
      BLOCKED_MENUS: '/rbac/menu-permissions/blocked',
      TENANT_ROLES: '/rbac/roles/tenant',
      TRANSFER_ROLE: '/rbac/roles/transfer',
      ROLE_ANALYTICS: '/rbac/roles/analytics',
      VALIDATE_ASSIGNMENT: '/rbac/roles/validate-assignment',
      VALIDATE_NAME: '/rbac/roles/validate-name',
      ROLE_ASSIGNMENT_HISTORY: '/rbac/audit/role-assignments',
      PERMISSION_CHANGE_HISTORY: '/rbac/audit/permission-changes',
      USER_ACCESS_REPORT: '/rbac/reports/user-access',
      CREATE_TEMPLATE: '/rbac/role-templates/create',
      LIST_TEMPLATES: '/rbac/role-templates/list',
      APPLY_TEMPLATE: '/rbac/role-templates/apply',
      ROLES_BY_HIERARCHY: '/rbac/roles/by-hierarchy',
      UNASSIGNED_USERS: '/rbac/users/unassigned',
      ROLE_USAGE_STATS: '/rbac/roles/usage-stats',
    },
  },

  // ==================== PERMISSIONS (Standalone - Backward Compatibility) ====================
  PERMISSIONS: {
    LIST: '/permissions/list',
    GET: '/permissions/get',
    CREATE: '/permissions/create',
    DELETE: '/permissions/delete',
    GRANT: '/permissions/grant',
    REVOKE: '/permissions/revoke',
    CHECK: '/permissions/check',
    CHECK_BATCH: '/permissions/check/batch',
    RESOURCE_LIST: '/permissions/resource/list',
    ACCESS_CHECK: '/permissions/access/check',
    SHARE_CREATE: '/permissions/share/create',
    SHARE_ACCESS: '/permissions/share/access',
    SHARE_REVOKE: '/permissions/share/revoke',
    SHARE_LIST: '/permissions/share/list',
  },

  // ==================== CHAT ====================
  CHAT: {
    CHANNELS: {
      LIST: '/chat/channels/list',
      CREATE: '/chat/channels/create',
      GET_BY_ID: '/chat/channels/get-by-id',
      UPDATE: '/chat/channels/update',
      ARCHIVE: '/chat/channels/archive',
      DELETE: '/chat/channels/delete',
      LEAVE: '/chat/channels/leave',
      PINNED_MESSAGES: '/chat/channels/pinned-messages',
      SETTINGS_GET: '/chat/channels/settings/get',
      SETTINGS_UPDATE: '/chat/channels/settings/update',
      ROTATE_KEY: '/chat/channels/rotate-key',
    },
    MEMBERS: {
      LIST: '/chat/channels/members/list',
      ADD: '/chat/channels/members/add',
      REMOVE: '/chat/channels/members/remove',
      UPDATE_ROLE: '/chat/channels/members/update-role',
    },
    NOTIFICATIONS: {
      UPDATE: '/chat/channels/notifications/update',
    },
    MESSAGES: {
      LIST: '/chat/messages/list',
      SEND: '/chat/messages/send',
      EDIT: '/chat/messages/edit',
      DELETE: '/chat/messages/delete',
      BULK_DELETE: '/chat/messages/bulk-delete',
      PIN: '/chat/messages/pin',
      FORWARD: '/chat/messages/forward',
      STATUS: '/chat/messages/status',
      STATUS_BULK: '/chat/messages/status/bulk',
    },
    REACTIONS: {
      ADD: '/chat/messages/reactions/add',
      LIST: '/chat/messages/reactions/list',
    },
    THREADS: {
      MESSAGES: '/chat/threads/messages',
      REPLY: '/chat/threads/reply',
    },
    SEARCH: '/chat/search',
    DIRECT: {
      SEND: '/chat/direct/send',
    },
    MARK_READ: '/chat/mark-read',
    MARK_READ_BULK: '/chat/mark-read/bulk',
    UNREAD: {
      COUNT: '/chat/unread/count',
    },
    FILES: {
      LIST: '/chat/channels/files/list',
      UPLOAD: '/chat/files/upload',
      DOWNLOAD: '/chat/files/download',
    },
    PRESENCE: {
      UPDATE: '/chat/presence/update',
      ONLINE: '/chat/presence/online',
    },
  },

  // ==================== SYSTEM CONFIG ====================
  SYSTEM_CONFIG: {
    LIST: '/system-config',
    GET: (id: string) => `/system-config/${id}`,
    CREATE: '/system-config',
    UPDATE: (id: string) => `/system-config/${id}`,
    DELETE: (id: string) => `/system-config/${id}`,
  },
} as const;