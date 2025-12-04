// lib/api/endpoints.ts - COMPLETE & ALIGNED WITH BACKEND

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

  // ==================== CHAT MESSAGES ====================
  CHAT: {
    // ✅ Messages - Aligned with chat.controller.ts
    MESSAGES: {
      SEND: "/chat/messages/send",
      LIST: "/chat/messages",
      EDIT: (id: number) => `/chat/messages/${id}`,
      DELETE: (id: number) => `/chat/messages/${id}`,
      MARK_READ: "/chat/messages/mark-read",
      BULK_MARK_READ: "/chat/messages/bulk-mark-read",
      PIN: "/chat/messages/pin",
      PINNED: "/chat/messages/pinned",
      FORWARD: "/chat/messages/forward",
      DETAILS: (messageId: number) => `/chat/messages/${messageId}/details`,
      ATTACHMENTS: (messageId: number) => `/chat/messages/${messageId}/attachments`,
      REACTIONS_LIST: (messageId: number) => `/chat/messages/${messageId}/reactions`,
      DELIVERY_STATUS: (messageId: number) => `/chat/messages/${messageId}/delivery-status`,
      MARK_DELIVERED: (messageId: number) => `/chat/messages/${messageId}/mark-delivered`,
      READ_STATUS: (messageId: number) => `/chat/messages/${messageId}/read-status`,
      READ_STATUS_DETAILED: (messageId: number) =>
        `/chat/messages/${messageId}/read-status-detailed`,
      // ✅ File Upload Endpoints
      UPLOAD: "/chat/messages/upload",
      UPLOAD_MULTIPLE: "/chat/messages/upload-multiple",
      FILE_DOWNLOAD: (attachmentId: number) => `/chat/messages/files/${attachmentId}/download`,
      FILE_DELETE: (attachmentId: number) => `/chat/messages/files/${attachmentId}`,
      // ✅ Add these new endpoints
      SEND_FILE: "/chat/messages/send-file",
      SEND_ATTACHMENT: "/chat/messages/send-attachment",
      PENDING_ATTACHMENTS: "/chat/attachments/pending"
    },

    // ✅ Reactions - Aligned with chat.controller.ts
    REACTIONS: {
      ADD: "/chat/messages/reaction",
      REMOVE: "/chat/messages/reaction/remove"
    },

    // ✅ Threads - Aligned with chat.controller.ts
    THREADS: {
      GET: (messageId: number) => `/chat/threads/${messageId}`,
      REPLY: (messageId: number) => `/chat/threads/${messageId}/reply`,
      ENHANCED: (messageId: number) => `/chat/threads/${messageId}/enhanced`
    },

    // ✅ Channels - Aligned with chat.controller.ts
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
      FILES: (id: number) => `/chat/channels/${id}/files`
    },

    // ✅ Channel Members - Aligned with chat.controller.ts
    MEMBERS: {
      LIST: (channelId: number) => `/chat/channels/${channelId}/members`,
      ADD: (channelId: number) => `/chat/channels/${channelId}/members`,
      REMOVE: (channelId: number, userId: number) =>
        `/chat/channels/${channelId}/members/${userId}`,
      UPDATE_ROLE: (channelId: number, userId: number) =>
        `/chat/channels/${channelId}/members/${userId}/role`
    },

    // ✅ Search - Aligned with chat.controller.ts
    SEARCH: "/chat/search",

    // ✅ Team - Aligned with chat.controller.ts
    TEAM: {
      MEMBERS: "/chat/team/members",
      AVAILABLE_MEMBERS: "/chat/team/available-members",
      START_CHAT: "/chat/team/start-chat"
    },

    // ✅ Presence - Aligned with chat.controller.ts
    PRESENCE: {
      ONLINE: "/chat/presence/online",
      OFFLINE: "/chat/presence/offline",
      ONLINE_USERS: "/chat/presence/online-users"
    },

    // ✅ Mentions - Aligned with chat.controller.ts
    MENTIONS: {
      LIST: "/chat/mentions",
      UNREAD_COUNT: "/chat/mentions/unread-count"
    },

    // ✅ Unread Count - Aligned with chat.controller.ts
    UNREAD: "/chat/unread",

    // ✅ Activities - Aligned with chat-activity.controller.ts
    ACTIVITIES: {
      CHANNEL: "/chat/activities/channel/:channelId", // Query param: channelId
      UNREAD: "/chat/activities/unread",
      MARK_READ: "/chat/activities/mark-read"
    },

    // ✅ Notifications - Aligned with chat-activity.controller.ts
    NOTIFICATIONS: {
      UNREAD_COUNT: "/chat/notifications/unread-count",
      LIST: "/chat/notifications",
      MARK_READ: "/chat/notifications/mark-read",
      PREFERENCES: "/chat/notifications/preferences"
    },

    // ✅ Collaboration - Aligned with collaboration.controller.ts
    COLLABORATION: {
      SEARCH_MEMBERS: "/collaboration/team/search"
    },

    // ✅ WebSocket Configuration
    WS: {
      URL: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3060",
      NAMESPACE: "/chat"
    }
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
  },

  // ==================== SUBSCRIPTIONS ====================
  SUBSCRIPTIONS: {
    PLANS: {
      LIST: "/subscriptions/plans",
      GET: (id: number) => `/subscriptions/plans/${id}`,
      CREATE: "/subscriptions/plans",
      UPDATE: (id: number) => `/subscriptions/plans/${id}`,
      DELETE: (id: number) => `/subscriptions/plans/${id}`
    },
    CUSTOM_PLANS: {
      CREATE: "/subscriptions/custom-plans",
      GET: (tenantId: number) => `/subscriptions/custom-plans/tenant/${tenantId}`
    },
    MY_SUBSCRIPTION: "/subscriptions/my-subscription",
    TENANT_SUBSCRIPTION: (tenantId: number) => `/subscriptions/tenant/${tenantId}`,
    CHANGE: "/subscriptions/change",
    CANCEL: "/subscriptions/cancel",
    REACTIVATE: "/subscriptions/reactivate",
    HISTORY: "/subscriptions/history",
    CHECK_LIMIT: "/subscriptions/check-limit",
    CHECK_FEATURE: "/subscriptions/check-feature",
    STATUS: "/subscriptions/status"
  }
} as const;
