// store/store.ts - CRITICAL FIX
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import menuPermissionsReducer from './slices/menu-permissions.slice';
import chatReducer from './slices/chatSlice';
import rolesReducer from './slices/roles.slice';
import permissionsReducer from './slices/permissions.slice';
import tenantReducer from './slices/tenantSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menuPermissions: menuPermissionsReducer,
    chat: chatReducer,
    roles: rolesReducer,
    permissions: permissionsReducer,
    tenant: tenantReducer,
    subscription: subscriptionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // ✅ CRITICAL: Ignore these actions to prevent serialization warnings
        ignoredActions: [
          'menuPermissions/fetchMyAccessibleMenus/fulfilled',
          'menuPermissions/setMenuAccess',
          'menuPermissions/fetchUserAccessibleMenus/fulfilled',
          'chat/addMessageToChannel',
          'chat/updateMessageInChannel',
          'chat/addReactionToMessage',
          'chat/removeReactionFromMessage',
          'chat/addTypingUser',
          'chat/removeTypingUser',
        ],
        // ✅ CRITICAL: Ignore these paths for Date objects
        ignoredPaths: [
          'chat.messages',
          'chat.threadMessages',
          'chat.typingUsers',
        ],
      },
    }),
  // ✅ CRITICAL: Enable DevTools
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;