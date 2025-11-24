// store/store.ts
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
        ignoredActions: [
          'menuPermissions/fetchMyAccessibleMenus/fulfilled',
          'menuPermissions/setMenuAccess',
          'menuPermissions/fetchUserAccessibleMenus/fulfilled',
        ],
      },
    }),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;