// store/store.ts - UPDATED WITH NEW SLICES
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import menuPermissionsReducer from './slices/menu-permissions.slice';
import chatReducer from './slices/chatSlice';
import rolesReducer from './slices/roles.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menuPermissions: menuPermissionsReducer,
    chat: chatReducer,
    roles: rolesReducer,
    menuPermissionsManagement: menuPermissionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [
          'menuPermissions/fetchMyAccessibleMenus/fulfilled',
          'menuPermissions/fetchUserAccessibleMenus/fulfilled',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;