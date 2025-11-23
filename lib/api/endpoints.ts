// lib/api/endpoints.ts - FIXED & ALIGNED WITH BACKEND

export const API_ENDPOINTS = {
  // ==================== AUTH ====================
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    VERIFY_REGISTRATION: "/auth/verify-registration",
    RESEND_VERIFICATION: "/auth/resend-verification",
    REFRESH_TOKEN: "/auth/refresh",
    ME: "/auth/me",
    PASSWORD_RESET_REQUEST: "/auth/password-reset/request",
    PASSWORD_RESET_CONFIRM: "/auth/password-reset/confirm",
    CREATE_AGENCY: "/auth/create-agency",
    CREATE_BRAND: "/auth/create-brand",
    CREATE_CREATOR: "/auth/create-creator",
    SESSIONS: "/auth/sessions",
    INVITE_ACCEPT: "/auth/invitation/accept",
    INVITE_SEND: "/auth/invitation/send",
    INVITE_RESEND: "/auth/invitation/resend",
    INVITE_CANCEL: "/auth/invitation/cancel"
  },

  // ==================== CHAT V2 (Ultra-Fast) ====================
  CHAT: {
    // Messages
    MESSAGES: {
      SEND: "/chat/messages/send",
      LIST: "/chat/messages",
      EDIT: (id: number) => `/chat/messages/${id}`,
      DELETE: (id: number) => `/chat/messages/${id}`,
      MARK_READ: "/chat/messages/mark-read",
      PIN: "/chat/messages/pin",
      PINNED: "/chat/messages/pinned",
      FORWARD: "/chat/messages/forward",
    },

    // Reactions
    REACTIONS: {
      ADD: "/chat/messages/reaction",
      REMOVE: "/chat/messages/reaction/remove",
    },

    // Threads
    THREADS: {
      GET: (messageId: number) => `/chat/threads/${messageId}`,
      REPLY: (messageId: number) => `/chat/threads/${messageId}/reply`,
    },

    // Channels
    CHANNELS: {
      LIST: "/chat/channels",
      CREATE: "/chat/channels/create",
      GET: (id: number) => `/chat/channels/${id}`,
      UPDATE: (id: number) => `/chat/channels/${id}`,
      DELETE: (id: number) => `/chat/channels/${id}`,
      ARCHIVE: (id: number) => `/chat/channels/${id}/archive`,
      UNARCHIVE: (id: number) => `/chat/channels/${id}/unarchive`,
      LEAVE: (id: number) => `/chat/channels/${id}/leave`,
      PIN: (id: number) => `/chat/channels/${id}/pin`,
      MUTE: (id: number) => `/chat/channels/${id}/mute`,
      FILES: (id: number) => `/chat/channels/${id}/files`,
    },

    // Channel Members
    MEMBERS: {
      LIST: (channelId: number) => `/chat/channels/${channelId}/members`,
      ADD: (channelId: number) => `/chat/channels/${channelId}/members`,
      REMOVE: (channelId: number, userId: number) => `/chat/channels/${channelId}/members/${userId}`,
      UPDATE_ROLE: (channelId: number, userId: number) => `/chat/channels/${channelId}/members/${userId}/role`,
      AVAILABLE: "/chat/team/available-members",
    },

    // Search
    SEARCH: "/chat/search",

    // Team
    TEAM: {
      MEMBERS: "/chat/team/members",
      AVAILABLE_MEMBERS: "/chat/team/available-members",
      START_CHAT: "/chat/team/start-chat",
    },

    // Activities
    ACTIVITIES: {
      CHANNEL: (channelId: number) => `/chat/activities/channel/${channelId}`,
      UNREAD: "/chat/activities/unread",
      MARK_READ: "/chat/activities/mark-read",
    },

    // Notifications
    NOTIFICATIONS: {
      UNREAD_COUNT: "/chat/notifications/unread-count",
      LIST: "/chat/notifications",
      MARK_READ: "/chat/notifications/mark-read",
      PREFERENCES: "/chat/notifications/preferences",
    },

    // Presence
    PRESENCE: {
      ONLINE: "/chat/presence/online",
      OFFLINE: "/chat/presence/offline",
      ONLINE_USERS: "/chat/presence/online-users",
    },

    // Unread
    UNREAD: "/chat/unread",

    // WebSocket
    WS: {
      URL: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3060",
      NAMESPACE: "/chat",
    },
  },


  // ==================== RBAC ====================
  RBAC: {
    ROLES: {
      LIST: "/rbac/roles/list",
      GET: "/rbac/roles/get",
      CREATE: "/rbac/roles/create",
      UPDATE: "/rbac/roles/update",
      DELETE: "/rbac/roles/delete"
    },

    PERMISSIONS: {
      LIST: "/rbac/permissions/list",
      GET: "/rbac/permissions/get",
      CREATE: "/rbac/permissions/create",
      DELETE: "/rbac/permissions/delete",
      ASSIGNABLE: "/rbac/permissions/assignable" // ✅ ADD THIS
    },

    ROLE_PERMISSIONS: {
      TREE: "/rbac/roles/permissions/tree",
      ASSIGN: "/rbac/roles/permissions/assign",
      BULK_ASSIGN: "/rbac/roles/permissions/bulk-assign",
      REMOVE: "/rbac/roles/permissions/remove"
    },

    USER_ROLES: {
      LIST: "/rbac/users/roles/list",
      ASSIGN: "/rbac/users/roles/assign",
      REMOVE: "/rbac/users/roles/remove",
      EFFECTIVE_PERMISSIONS: "/rbac/users/permissions/effective"
    },

    MENU_PERMISSIONS: {
      LINK: "/rbac/menu-permissions/link",
      BULK_LINK: "/rbac/menu-permissions/bulk-link",
      UNLINK: "/rbac/menu-permissions/unlink",
      MENU_GET: "/rbac/menu-permissions/menu/get",
      LIST: "/rbac/menu-permissions/list",
      USER_ACCESS: "/rbac/menu-permissions/user-access",
      MY_ACCESS: "/rbac/menu-permissions/my-access",
      CHECK_ACCESS: "/rbac/menu-permissions/check-access"
    },

    RESOURCE_PERMISSIONS: {
      GRANT: "/rbac/resource-permissions/grant",
      REVOKE: "/rbac/resource-permissions/revoke",
      CHECK: "/rbac/resource-permissions/check",
      CHECK_BATCH: "/rbac/resource-permissions/check-batch",
      LIST: "/rbac/resource-permissions/list"
    },

    ROLE_LIMITS: {
      CREATE: "/rbac/role-limits/create",
      UPDATE: "/rbac/role-limits/update",
      GET: "/rbac/role-limits/get"
    },

    ENHANCED: {
      BULK_ASSIGN_ROLES: "/rbac/users/roles/bulk-assign",
      BULK_REMOVE_ROLES: "/rbac/users/roles/bulk-remove",
      BULK_ASSIGN_USERS: "/rbac/roles/users/bulk-assign",
      CLONE_ROLE: "/rbac/roles/clone",
      COMPARE_ROLES: "/rbac/roles/compare",
      SEARCH_PERMISSIONS: "/rbac/permissions/search",
      AVAILABLE_PERMISSIONS: "/rbac/permissions/available",
      MENU_HIERARCHY: "/rbac/menu-permissions/hierarchy",
      BLOCKED_MENUS: "/rbac/menu-permissions/blocked",
      TENANT_ROLES: "/rbac/roles/tenant",
      TRANSFER_ROLE: "/rbac/roles/transfer",
      ROLE_ANALYTICS: "/rbac/roles/analytics",
      VALIDATE_ASSIGNMENT: "/rbac/roles/validate-assignment",
      VALIDATE_NAME: "/rbac/roles/validate-name",
      ROLE_ASSIGNMENT_HISTORY: "/rbac/audit/role-assignments",
      PERMISSION_CHANGE_HISTORY: "/rbac/audit/permission-changes",
      USER_ACCESS_REPORT: "/rbac/reports/user-access",
      CREATE_TEMPLATE: "/rbac/role-templates/create",
      LIST_TEMPLATES: "/rbac/role-templates/list",
      APPLY_TEMPLATE: "/rbac/role-templates/apply",
      ROLES_BY_HIERARCHY: "/rbac/roles/by-hierarchy",
      UNASSIGNED_USERS: "/rbac/users/unassigned",
      ROLE_USAGE_STATS: "/rbac/roles/usage-stats"
    }
  },

  // ==================== SYSTEM CONFIG ====================
  SYSTEM_CONFIG: {
    LIST: "/system-config",
    GET: (id: string) => `/system-config/${id}`,
    CREATE: "/system-config",
    UPDATE: (id: string) => `/system-config/${id}`,
    DELETE: (id: string) => `/system-config/${id}`
  },

  // ==================== TENANTS ====================
  TENANTS: {
    MY_TENANTS: "/tenants/my-tenants",
    GET: (id: string) => `/tenants/${id}`,
    UPDATE: (id: string) => `/tenants/${id}`,
    MEMBERS: (id: string) => `/tenants/${id}/members`,
    USAGE: (id: string) => `/tenants/${id}/usage`
  }
} as const;
