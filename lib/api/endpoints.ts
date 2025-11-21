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
    SESSIONS: "/auth/sessions"
  },

  // ==================== CHAT V2 (Ultra-Fast) ====================
  CHAT: {
    // Ultra-Fast Endpoints (v2)
    V2: {
      SEND: "/chat/v2/messages/send",
      GET_MESSAGES: "/chat/v2/messages",
      BATCH_SEND: "/chat/v2/messages/batch",
      MARK_READ: "/chat/v2/messages/mark-read",
      UNREAD_COUNT: "/chat/v2/unread",
      CHANNELS_LIST: "/chat/v2/channels",
      CHANNELS_CREATE: "/chat/v2/channels/create",
      CHANNEL_BY_ID: "/chat/v2/channels/:id",
      HEALTH: "/chat/v2/health"
    },

    // Standard Endpoints
    CHANNELS: {
      LIST: "/chat/channels/list",
      CREATE: "/chat/channels/create",
      GET_BY_ID: "/chat/channels/get-by-id",
      UPDATE: "/chat/channels/update",
      ARCHIVE: "/chat/channels/archive",
      DELETE: "/chat/channels/delete",
      LEAVE: "/chat/channels/leave",
      PINNED_MESSAGES: "/chat/channels/pinned-messages",
      SETTINGS_GET: "/chat/channels/settings/get",
      SETTINGS_UPDATE: "/chat/channels/settings/update",
      ROTATE_KEY: "/chat/channels/rotate-key"
    },

    MEMBERS: {
      LIST: "/chat/channels/members/list",
      ADD: "/chat/channels/members/add",
      REMOVE: "/chat/channels/members/remove",
      UPDATE_ROLE: "/chat/channels/members/update-role"
    },

    NOTIFICATIONS: {
      UPDATE: "/chat/channels/notifications/update"
    },

    MESSAGES: {
      LIST: "/chat/messages/list",
      SEND: "/chat/messages/send",
      EDIT: "/chat/messages/edit",
      DELETE: "/chat/messages/delete",
      BULK_DELETE: "/chat/messages/bulk-delete",
      PIN: "/chat/messages/pin",
      FORWARD: "/chat/messages/forward",
      STATUS: "/chat/messages/status",
      STATUS_BULK: "/chat/messages/status/bulk"
    },

    REACTIONS: {
      ADD: "/chat/messages/reactions/add",
      LIST: "/chat/messages/reactions/list"
    },

    THREADS: {
      MESSAGES: "/chat/threads/messages",
      REPLY: "/chat/threads/reply"
    },

    SEARCH: "/chat/search",

    DIRECT: {
      SEND: "/chat/direct/send"
    },

    MARK_READ: "/chat/mark-read",
    MARK_READ_BULK: "/chat/mark-read/bulk",

    UNREAD: {
      COUNT: "/chat/unread/count"
    },

    FILES: {
      LIST: "/chat/channels/files/list",
      UPLOAD: "/chat/files/upload",
      DOWNLOAD: "/chat/files/download"
    },

    PRESENCE: {
      UPDATE: "/chat/presence/update",
      ONLINE: "/chat/presence/online",
      TYPING_START: "/chat/presence/typing/start",
      TYPING_STOP: "/chat/presence/typing/stop"
    },

    // WebSocket endpoint
    WS: "/chat"
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
      ASSIGNABLE: "/rbac/permissions/assignable"
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