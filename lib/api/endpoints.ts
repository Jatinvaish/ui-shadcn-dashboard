// // lib/api/endpoints.ts
// export const API_ENDPOINTS = {
//   // Auth
//   AUTH: {
//     REGISTER: '/auth/register',
//     LOGIN: '/auth/login',
//     LOGOUT: '/auth/logout',
//     VERIFY_REGISTRATION: '/auth/verify-registration',
//     RESEND_VERIFICATION: '/auth/resend-verification',
//     REFRESH_TOKEN: '/auth/refresh',
//     ME: '/auth/me',
//     FORGOT_PASSWORD: '/auth/password-reset/request',
//     RESET_PASSWORD: '/auth/password-reset/confirm',
//     SEND_INVITATION: '/auth/invitation/send',
//     ACCEPT_INVITATION: '/auth/invitation/accept',
//     GOOGLE_LOGIN: '/auth/google/callback',
//     MICROSOFT_LOGIN: '/auth/microsoft/callback',
//     APPLE_LOGIN: '/auth/apple/callback',
//     CREATE_AGENCY: '/auth/create-agency',
//     CREATE_BRAND: '/auth/create-brand',
//     CREATE_CREATOR: '/auth/create-creator',
//   },
//   CHAT: {
//     CHANNELS: {
//       LIST: "/chat/channels/list",
//       CREATE: "/chat/channels/create",
//       GET_BY_ID: "/chat/channels/get-by-id",
//       UPDATE: "/chat/channels/update",
//       ARCHIVE: "/chat/channels/archive",
//       DELETE: "/chat/channels/delete",
//       LEAVE: "/chat/channels/leave",
//       PINNED_MESSAGES: "/chat/channels/pinned-messages",
//     },
//     MEMBERS: {
//       LIST: "/chat/channels/members/list",
//       ADD: "/chat/channels/members/add",
//       REMOVE: "/chat/channels/members/remove",
//       UPDATE_ROLE: "/chat/channels/members/update-role",
//     },
//     NOTIFICATIONS: {
//       UPDATE: "/chat/channels/members/notifications/update",
//     },
//     MESSAGES: {
//       LIST: "/chat/messages/list",
//       SEND: "/chat/messages/send",
//       REPLY: "/chat/messages/reply",
//       EDIT: "/chat/messages/edit",
//       DELETE: "/chat/messages/delete",
//       PIN: "/chat/messages/pin",
//     },
//     REACTIONS:{
//       ADD: "/chat/messages/reactions/add",
//       REMOVE: "/chat/messages/reactions/remove",
//       LIST: "/chat/messages/reactions/list",
//     },
//     THREADS: {
//       LIST: "/chat/threads/list",
//       SEND: "/chat/threads/send",
//       MESSAGES: "/chat/threads/messages",
//     },
//     SEARCH: {
//       MESSAGES: "/chat/messages/search",
//     },
//     USERS: {
//       DIRECT_MESSAGE: "/chat/users/direct-message",
//     },
//     GROUP: {
//       CREATE: "/chat/users/group/create",
//       ADD: "/chat/users/group/add",
//       REMOVE: "/chat/users/group/remove",
//     },
//     PRIVATE: {
//       CREATE: "/chat/users/private/create",
//       ADD: "/chat/users/private/add",
//       REMOVE: "/chat/users/private/remove",
//     },
//     THREAD_MESSAGES: {
//       LIST: "/chat/threads/messages/list",
//       SEND: "/chat/threads/messages/send",
//     },
//     SEARCH_MESSAGES: {
//       ALL: "/chat/messages/search/all",
//     },
//     DIRECT_MESSAGES: {
//       LIST: "/chat/users/direct-messages/list",
//       SEND: "/chat/users/direct-messages/send",
//     },
//     GROUP_MESSAGES: {
//       LIST: "/chat/users/group-messages/list",
//       SEND: "/chat/users/group-messages/send",
//     },
//     PRIVATE_MESSAGES: {
//       LIST: "/chat/users/private-messages/list",
//       SEND: "/chat/users/private-messages/send",
//     },
//     FILES: {
//       UPLOAD: "/chat/files/upload",
//       DOWNLOAD: "/chat/files/download",
//       LIST: "/chat/files/list",
//     },
//     DIRECT:{
//       SEND: "/chat/direct/send",
//       LIST: "/chat/direct/list",
//     },
//     UNREAD:{
//       COUNT: "/chat/unread/count",
//     },
//     MARK_READ: "/chat/mark-read",
//   },

//   // System Config
//   SYSTEM_CONFIG: {
//     LIST: '/system-config',
//     GET: (id: string) => `/system-config/${id}`,
//     CREATE: '/system-config',
//     UPDATE: (id: string) => `/system-config/${id}`,
//     DELETE: (id: string) => `/system-config/${id}`,
//   },

//   // Audit Logs
//   AUDIT_LOGS: {
//     QUERY: '/audit-logs/query',
//     GET: (id: string) => `/audit-logs/${id}`,
//     CREATE: '/audit-logs',
//   },

//   // System Events
//   SYSTEM_EVENTS: {
//     QUERY: '/system-events/query',
//     CREATE: '/system-events',
//   },

//   // RBAC (Roles, Role-Permissions, User-Roles)
//   RBAC: {
//     ROLES: {
//       LIST: '/rbac/roles/list',
//       GET: '/rbac/roles/get',
//       CREATE: '/rbac/roles/create',
//       UPDATE: '/rbac/roles/update',
//       DELETE: '/rbac/roles/delete',
//     },
//     ROLE_PERMISSIONS: {
//       LIST: '/rbac/roles/permissions/list',
//       ASSIGN: '/rbac/roles/permissions/assign',
//       REMOVE: '/rbac/roles/permissions/remove',
//     },
//     USER_ROLES: {
//       ASSIGN: '/rbac/users/roles/assign',
//       LIST: '/rbac/users/roles/list',
//       REMOVE: '/rbac/users/roles/remove',
//     },
//     SEED: '/rbac/seed/system-data',
//   },

//   // Permissions (RBAC Permissions + Resource Permissions)
//   PERMISSIONS: {
//     // RBAC Permissions CRUD
//     LIST: '/permissions/list',
//     GET: '/permissions/get',
//     CREATE: '/permissions/create',
//     DELETE: '/permissions/delete',

//     // Resource Permissions (Google Docs/Slack-like)
//     GRANT: '/permissions/grant',
//     REVOKE: '/permissions/revoke',
//     CHECK: '/permissions/check',
//     CHECK_BATCH: '/permissions/check/batch',
//     RESOURCE_LIST: '/permissions/resource/list',
//     ACCESS_CHECK: '/permissions/access/check',

//     // Sharing
//     SHARE: {
//       CREATE: '/permissions/share/create',
//       ACCESS: '/permissions/share/access',
//       REVOKE: '/permissions/share/revoke',
//       LIST: '/permissions/share/list',
//     },
//   },

//   // Menu Permissions
//   MENU_PERMISSIONS: {
//     LINK: '/menu-permissions/link',
//     BULK_LINK: '/menu-permissions/bulk-link',
//     UNLINK: '/menu-permissions/unlink',
//     GET_MENU: '/menu-permissions/menu/get',
//     LIST: '/menu-permissions/list',
//     GET: '/menu-permissions/get',
//     UPDATE: '/menu-permissions/update',
//     USER_ACCESS: '/menu-permissions/user-access',
//     MY_ACCESS: '/menu-permissions/my-access',
//   },
//    ABAC: {
//     ATTRIBUTES: {
//       LIST: "/abac/attributes",
//       CREATE: "/abac/attributes",
//     },
//     USER_ATTRIBUTES: {
//       ASSIGN: (userId: string) => `/abac/users/${userId}/attributes`,
//       GET: (userId: string) => `/abac/users/${userId}/attributes`,
//       UPDATE: (userId: string, attributeId: string) =>
//         `/abac/users/${userId}/attributes/${attributeId}`,
//       DELETE: (userId: string, attributeId: string) =>
//         `/abac/users/${userId}/attributes/${attributeId}`,
//     },
//     RESOURCE_ATTRIBUTES: {
//       ASSIGN: "/abac/resources/attributes",
//       GET: (resourceType: string, resourceId: string) =>
//         `/abac/resources/${resourceType}/${resourceId}/attributes`,
//       DELETE: (resourceType: string, resourceId: string, attributeId: string) =>
//         `/abac/resources/${resourceType}/${resourceId}/attributes/${attributeId}`,
//     },
//     POLICIES: {
//       QUERY: "/abac/policies/query",
//       CREATE: "/abac/policies",
//       EVALUATE: "/abac/evaluate",
//     },
//   },
// } as const;


// lib/api/endpoints.ts - VERIFIED
export const API_ENDPOINTS = {
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
  },
  TENANTS: {
    MY_TENANTS: '/tenants/my-tenants',
    GET: (id: string) => `/tenants/${id}`,
    UPDATE: (id: string) => `/tenants/${id}`,
    MEMBERS: (id: string) => `/tenants/${id}/members`,
    USAGE: (id: string) => `/tenants/${id}/usage`,
  },
  RBAC: {
    ROLES_LIST: '/rbac/roles/list',
    ROLES_GET: '/rbac/roles/get',
    ROLES_CREATE: '/rbac/roles/create',
    ROLES_UPDATE: '/rbac/roles/update',
    ROLES_DELETE: '/rbac/roles/delete',
    PERMISSIONS_TREE: '/rbac/roles/permissions/tree',
    PERMISSIONS_BULK_ASSIGN: '/rbac/roles/permissions/bulk-assign',
    USER_ROLES_ASSIGN: '/rbac/users/roles/assign',
    USER_ROLES_LIST: '/rbac/users/roles/list',
    USER_ROLES_REMOVE: '/rbac/users/roles/remove',
  },
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
  MENU_PERMISSIONS: {
    LINK: '/menu-permissions/link',
    BULK_LINK: '/menu-permissions/bulk-link',
    UNLINK: '/menu-permissions/unlink',
    MENU_GET: '/menu-permissions/menu/get',
    LIST: '/menu-permissions/list',
    USER_ACCESS: '/menu-permissions/user-access',
    MY_ACCESS: '/menu-permissions/my-access',
    CHECK_ACCESS: '/menu-permissions/check-access',
  },
  CHAT: {
    CHANNELS: {
      LIST: "/chat/channels/list",
      CREATE: "/chat/channels/create",
      GET_BY_ID: "/chat/channels/get-by-id",
      UPDATE: "/chat/channels/update",
      ARCHIVE: "/chat/channels/archive",
      DELETE: "/chat/channels/delete",
      LEAVE: "/chat/channels/leave",
      PINNED_MESSAGES: "/chat/channels/pinned-messages",
    },
    MEMBERS: {
      LIST: "/chat/channels/members/list",
      ADD: "/chat/channels/members/add",
      REMOVE: "/chat/channels/members/remove",
      UPDATE_ROLE: "/chat/channels/members/update-role",
    },
    NOTIFICATIONS: {
      UPDATE: "/chat/channels/members/notifications/update",
    },
    MESSAGES: {
      LIST: "/chat/messages/list",
      SEND: "/chat/messages/send",
      REPLY: "/chat/messages/reply",
      EDIT: "/chat/messages/edit",
      DELETE: "/chat/messages/delete",
      PIN: "/chat/messages/pin",
    },
    REACTIONS: {
      ADD: "/chat/messages/reactions/add",
      REMOVE: "/chat/messages/reactions/remove",
      LIST: "/chat/messages/reactions/list",
    },
    THREADS: {
      LIST: "/chat/threads/list",
      SEND: "/chat/threads/send",
      MESSAGES: "/chat/threads/messages",
    },
    SEARCH: {
      MESSAGES: "/chat/messages/search",
    },
    USERS: {
      DIRECT_MESSAGE: "/chat/users/direct-message",
    },
    GROUP: {
      CREATE: "/chat/users/group/create",
      ADD: "/chat/users/group/add",
      REMOVE: "/chat/users/group/remove",
    },
    PRIVATE: {
      CREATE: "/chat/users/private/create",
      ADD: "/chat/users/private/add",
      REMOVE: "/chat/users/private/remove",
    },
    THREAD_MESSAGES: {
      LIST: "/chat/threads/messages/list",
      SEND: "/chat/threads/messages/send",
    },
    SEARCH_MESSAGES: {
      ALL: "/chat/messages/search/all",
    },
    DIRECT_MESSAGES: {
      LIST: "/chat/users/direct-messages/list",
      SEND: "/chat/users/direct-messages/send",
    },
    GROUP_MESSAGES: {
      LIST: "/chat/users/group-messages/list",
      SEND: "/chat/users/group-messages/send",
    },
    PRIVATE_MESSAGES: {
      LIST: "/chat/users/private-messages/list",
      SEND: "/chat/users/private-messages/send",
    },
    FILES: {
      UPLOAD: "/chat/files/upload",
      DOWNLOAD: "/chat/files/download",
      LIST: "/chat/files/list",
    },
    DIRECT: {
      SEND: "/chat/direct/send",
      LIST: "/chat/direct/list",
    },
    UNREAD: {
      COUNT: "/chat/unread/count",
    },
    MARK_READ: "/chat/mark-read",
  },
  SYSTEM_CONFIG: {
    LIST: '/system-config',
    GET: (id: string) => `/system-config/${id}`,
    CREATE: '/system-config',
    UPDATE: (id: string) => `/system-config/${id}`,
    DELETE: (id: string) => `/system-config/${id}`,
  },
};