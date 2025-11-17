// store/slices/menu-permissions.slice.ts - COMPLETELY FIXED VERSION
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  RbacService,
  MenuPermission,
  LinkMenuPermissionPayload,
  BulkLinkMenuPermissionsPayload,
  ListMenuPermissionsParams,
  UserAccessibleMenusResponse,
  Permission
} from '@/lib/api/services/rbac-service';
import type { RootState } from '../store';

interface MenuPermissionsState {
  menuPermissions: MenuPermission[];
  allPermissions: Permission[];
  accessibleMenus: string[];
  userPermissions: Permission[];
  blockedMenus: Array<{
    menu_key: string;
    blocked_reasons?: string[];
    required_permissions?: string[];
  }>;

  loading: {
    list: boolean;
    link: boolean;
    unlink: boolean;
    myAccess: boolean;
    userAccess: boolean;
    allPermissions: boolean;
  };

  error: string | null;
  initialized: boolean;

  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  // ✅ NEW: Track last fetch to prevent duplicates
  lastFetch: {
    menuPermissions: string | null;
    allPermissions: string | null;
  };
}

const initialState: MenuPermissionsState = {
  menuPermissions: [],
  allPermissions: [],
  accessibleMenus: [],
  userPermissions: [],
  blockedMenus: [],
  loading: {
    list: false,
    link: false,
    unlink: false,
    myAccess: false,
    userAccess: false,
    allPermissions: false,
  },
  error: null,
  initialized: false,
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  lastFetch: {
    menuPermissions: null,
    allPermissions: null,
  },
};

// ==================== ASYNC THUNKS ====================

export const fetchMenuPermissions = createAsyncThunk(
  'menuPermissions/fetchMenuPermissions',
  async (params: ListMenuPermissionsParams, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const cacheKey = JSON.stringify(params);

      // ✅ Prevent duplicate requests
      if (state.menuPermissions.lastFetch.menuPermissions === cacheKey &&
        state.menuPermissions.loading.list) {
        console.log('🚫 Duplicate fetchMenuPermissions prevented');
        return rejectWithValue('DUPLICATE_REQUEST');
      }

      console.log('📡 Calling listMenuPermissions API with:', params);
      const response = await RbacService.listMenuPermissions(params);
      console.log('✅ API Response:', response);

      return {
        menuPermissionsList: response.data?.menuPermissionsList || [],
        meta: response.data?.meta || initialState.pagination,
        cacheKey,
      };
    } catch (error: any) {
      console.error('❌ fetchMenuPermissions error:', error);
      return rejectWithValue(error?.message || 'Failed to fetch menu permissions');
    }
  }
);

// ✅ CRITICAL FIX: Proper response handling
export const fetchAllPermissions = createAsyncThunk(
  'menuPermissions/fetchAllPermissions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;

      // ✅ Prevent duplicate requests
      if (state.menuPermissions.loading.allPermissions) {
        console.log('🚫 Duplicate fetchAllPermissions prevented');
        return rejectWithValue('DUPLICATE_REQUEST');
      }

      // ✅ Check if already loaded
      if (state.menuPermissions.allPermissions.length > 0) {
        console.log('✅ All permissions already loaded, using cache');
        return state.menuPermissions.allPermissions;
      }

      console.log('📡 Fetching all permissions...');
      const response = await RbacService.getAllPermissions();
      console.log('✅ Raw response:', response);

      // ✅ Handle different response structures
      let permissionsList: Permission[];

      if (response.data?.permissionsList) {
        permissionsList = response.data.permissionsList;
      } else if (Array.isArray(response.data)) {
        permissionsList = response.data;
      } else if (Array.isArray(response)) {
        permissionsList = response;
      } else {
        console.error('❌ Unexpected response structure:', response);
        permissionsList = [];
      }

      console.log('✅ All permissions loaded:', permissionsList.length);
      return permissionsList;
    } catch (error: any) {
      console.error('❌ fetchAllPermissions error:', error);
      return rejectWithValue(error?.message || 'Failed to fetch permissions');
    }
  }
);

export const linkMenuPermission = createAsyncThunk(
  'menuPermissions/linkMenuPermission',
  async (payload: LinkMenuPermissionPayload, { rejectWithValue }) => {
    try {
      console.log('📡 Linking menu permission:', payload);
      const response = await RbacService.linkMenuPermission(payload);
      console.log('✅ Menu permission linked:', response);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to link menu permission');
    } catch (error: any) {
      console.error('❌ linkMenuPermission error:', error);
      return rejectWithValue(error?.message || 'Failed to link menu permission');
    }
  }
);

export const bulkLinkMenuPermissions = createAsyncThunk(
  'menuPermissions/bulkLinkMenuPermissions',
  async (payload: BulkLinkMenuPermissionsPayload, { rejectWithValue }) => {
    try {
      console.log('📡 Bulk linking menu permissions:', payload);
      const response = await RbacService.bulkLinkMenuPermissions(payload);
      console.log('✅ Bulk link response:', response);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to bulk link menu permissions');
    } catch (error: any) {
      console.error('❌ bulkLinkMenuPermissions error:', error);
      return rejectWithValue(error?.message || 'Failed to bulk link menu permissions');
    }
  }
);

export const unlinkMenuPermission = createAsyncThunk(
  'menuPermissions/unlinkMenuPermission',
  async (payload: { menuKey: string; permissionId: number }, { rejectWithValue }) => {
    try {
      console.log('📡 Unlinking menu permission:', payload);
      const response = await RbacService.unlinkMenuPermission(payload);
      console.log('✅ Menu permission unlinked:', response);

      if (response.success && response.data) {
        return {
          ...response.data,
          menuKey: payload.menuKey,
          permissionId: payload.permissionId
        };
      }

      throw new Error('Failed to unlink menu permission');
    } catch (error: any) {
      console.error('❌ unlinkMenuPermission error:', error);
      return rejectWithValue(error?.message || 'Failed to unlink menu permission');
    }
  }
);

export const fetchMyAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchMyAccessibleMenus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('📡 Fetching my accessible menus...');
      const response = await RbacService.getMyAccessibleMenus();
      console.log('✅ My accessible menus loaded:', response.data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch accessible menus');
    } catch (error: any) {
      console.error('❌ fetchMyAccessibleMenus error:', error);
      return rejectWithValue(error?.message || 'Failed to fetch accessible menus');
    }
  }
);

export const fetchUserAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchUserAccessibleMenus',
  async (userId: number | undefined, { rejectWithValue }) => {
    try {
      console.log('📡 Fetching user accessible menus for:', userId);
      const response = await RbacService.getUserAccessibleMenus(userId);
      console.log('✅ User accessible menus loaded:', response.data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch user accessible menus');
    } catch (error: any) {
      console.error('❌ fetchUserAccessibleMenus error:', error);
      return rejectWithValue(error?.message || 'Failed to fetch user accessible menus');
    }
  }
);

export const checkMenuAccess = createAsyncThunk(
  'menuPermissions/checkMenuAccess',
  async (payload: { menuKey: string; userId?: number }, { rejectWithValue }) => {
    try {
      const response = await RbacService.checkMenuAccess(payload.menuKey, payload.userId);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to check menu access');
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to check menu access');
    }
  }
);

// ==================== SLICE ====================

const menuPermissionsSlice = createSlice({
  name: 'menuPermissions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setMenuAccess: (state, action: PayloadAction<{
      accessibleMenus: string[];
      userPermissions: Permission[];
      blockedMenus?: Array<{
        menu_key: string;
        blocked_reasons?: string[];
        required_permissions?: string[];
      }>;
    }>) => {
      state.accessibleMenus = action.payload.accessibleMenus;
      state.userPermissions = action.payload.userPermissions;
      if (action.payload.blockedMenus) {
        state.blockedMenus = action.payload.blockedMenus;
      }
      state.initialized = true;
    },
    resetMenuPermissions: (state) => {
      state.accessibleMenus = [];
      state.userPermissions = [];
      state.blockedMenus = [];
      state.initialized = false;
    },
    // ✅ NEW: Clear cache action
    clearCache: (state) => {
      state.lastFetch.menuPermissions = null;
      state.lastFetch.allPermissions = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Menu Permissions List
    builder
      .addCase(fetchMenuPermissions.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchMenuPermissions.fulfilled, (state, action) => {
        // ✅ Handle duplicate request rejection
        //todo
        //@ts-ignore
        if (action.payload === 'DUPLICATE_REQUEST') {
          state.loading.list = false;
          return;
        }

        state.loading.list = false;
        state.menuPermissions = action.payload.menuPermissionsList;
        state.pagination = action.payload.meta;
        state.lastFetch.menuPermissions = action.payload.cacheKey;
        console.log('✅ State updated with menu permissions:', state.menuPermissions.length);
      })
      .addCase(fetchMenuPermissions.rejected, (state, action) => {
        state.loading.list = false;
        if (action.payload !== 'DUPLICATE_REQUEST') {
          state.error = action.payload as string;
          console.error('❌ Failed to load menu permissions:', action.payload);
        }
      });

    // Fetch All Permissions
    builder
      .addCase(fetchAllPermissions.pending, (state) => {
        state.loading.allPermissions = true;
        state.error = null;
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        // ✅ Handle duplicate request rejection
        //todo
        //@ts-ignore
        if (action.payload === 'DUPLICATE_REQUEST') {
          state.loading.allPermissions = false;
          return;
        }

        state.loading.allPermissions = false;
        state.allPermissions = action.payload;
        state.lastFetch.allPermissions = Date.now().toString();
        console.log('✅ All permissions loaded:', action.payload.length);
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.loading.allPermissions = false;
        if (action.payload !== 'DUPLICATE_REQUEST') {
          state.error = action.payload as string;
          console.error('❌ Failed to load all permissions:', action.payload);
        }
      });

    // Link Menu Permission
    builder
      .addCase(linkMenuPermission.pending, (state) => {
        state.loading.link = true;
        state.error = null;
      })
      .addCase(linkMenuPermission.fulfilled, (state, action) => {
        state.loading.link = false;
        const index = state.menuPermissions.findIndex(
          mp => mp.menu_key === action.payload.menu_key &&
            mp.permission_id === action.payload.permission_id
        );
        if (index !== -1) {
          state.menuPermissions[index] = action.payload;
        } else {
          state.menuPermissions.unshift(action.payload);
        }
        // ✅ Invalidate cache
        state.lastFetch.menuPermissions = null;
        console.log('✅ Menu permission linked:', action.payload);
      })
      .addCase(linkMenuPermission.rejected, (state, action) => {
        state.loading.link = false;
        state.error = action.payload as string;
      });

    // Bulk Link Menu Permissions
    builder
      .addCase(bulkLinkMenuPermissions.pending, (state) => {
        state.loading.link = true;
        state.error = null;
      })
      .addCase(bulkLinkMenuPermissions.fulfilled, (state, action) => {
        state.loading.link = false;
        if (Array.isArray(action.payload)) {
          action.payload.forEach((newPerm: MenuPermission) => {
            const index = state.menuPermissions.findIndex(
              mp => mp.menu_key === newPerm.menu_key &&
                mp.permission_id === newPerm.permission_id
            );
            if (index !== -1) {
              state.menuPermissions[index] = newPerm;
            } else {
              state.menuPermissions.push(newPerm);
            }
          });
        }
        // ✅ Invalidate cache
        state.lastFetch.menuPermissions = null;
        console.log('✅ Bulk link completed');
      })
      .addCase(bulkLinkMenuPermissions.rejected, (state, action) => {
        state.loading.link = false;
        state.error = action.payload as string;
      });

    // Unlink Menu Permission
    builder
      .addCase(unlinkMenuPermission.pending, (state) => {
        state.loading.unlink = true;
        state.error = null;
      })
      .addCase(unlinkMenuPermission.fulfilled, (state, action) => {
        state.loading.unlink = false;
        state.menuPermissions = state.menuPermissions.filter(
          mp => !(mp.menu_key === action.payload.menuKey &&
            mp.permission_id === action.payload.permissionId)
        );
        // ✅ Invalidate cache
        state.lastFetch.menuPermissions = null;
        console.log('✅ Menu permission unlinked');
      })
      .addCase(unlinkMenuPermission.rejected, (state, action) => {
        state.loading.unlink = false;
        state.error = action.payload as string;
      });

    // Fetch My Accessible Menus
    builder
      .addCase(fetchMyAccessibleMenus.pending, (state) => {
        state.loading.myAccess = true;
        state.error = null;
      })
      .addCase(fetchMyAccessibleMenus.fulfilled, (state, action) => {
        state.loading.myAccess = false;
        state.accessibleMenus = action.payload.accessibleMenus;
        state.userPermissions = action.payload.userPermissions;
        state.blockedMenus = action.payload.blockedMenus;
        state.initialized = true;
        console.log('✅ My accessible menus loaded:', state.accessibleMenus.length);
      })
      .addCase(fetchMyAccessibleMenus.rejected, (state, action) => {
        state.loading.myAccess = false;
        state.error = action.payload as string;
        state.initialized = true;
      });

    // Fetch User Accessible Menus
    builder
      .addCase(fetchUserAccessibleMenus.pending, (state) => {
        state.loading.userAccess = true;
        state.error = null;
      })
      .addCase(fetchUserAccessibleMenus.fulfilled, (state) => {
        state.loading.userAccess = false;
      })
      .addCase(fetchUserAccessibleMenus.rejected, (state, action) => {
        state.loading.userAccess = false;
        state.error = action.payload as string;
      });

    // Check Menu Access
    builder
      .addCase(checkMenuAccess.pending, (state) => {
        state.error = null;
      })
      .addCase(checkMenuAccess.fulfilled, () => {
        // Result handled by caller
      })
      .addCase(checkMenuAccess.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================

export const { clearError, setMenuAccess, resetMenuPermissions, clearCache } = menuPermissionsSlice.actions;

// Selectors
export const selectMenuPermissions = (state: RootState) => state.menuPermissions.menuPermissions;
export const selectAllPermissions = (state: RootState) => state.menuPermissions.allPermissions;
export const selectAccessibleMenus = (state: RootState) => state.menuPermissions.accessibleMenus;
export const selectUserPermissions = (state: RootState) => state.menuPermissions.userPermissions;
export const selectBlockedMenus = (state: RootState) => state.menuPermissions.blockedMenus;
export const selectMenuPermissionsLoading = (state: RootState) => state.menuPermissions.loading.list;
export const selectMenuPermissionsLoadingAny = (state: RootState) =>
  Object.values(state.menuPermissions.loading).some(loading => loading);
export const selectMenuPermissionsError = (state: RootState) => state.menuPermissions.error;
export const selectMenuPermissionsInitialized = (state: RootState) => state.menuPermissions.initialized;
export const selectMenuPermissionsPagination = (state: RootState) => state.menuPermissions.pagination;

export default menuPermissionsSlice.reducer;