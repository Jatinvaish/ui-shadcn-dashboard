// store/slices/menu-permissions.slice.ts - UPDATED WITH BACKEND DTO ALIGNMENT
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
  // Menu Permissions List
  menuPermissions: MenuPermission[];
  allPermissions: Permission[];
  
  // User Access
  accessibleMenus: string[];
  userPermissions: Permission[];
  blockedMenus: Array<{
    menu_key: string;
    blocked_reasons?: string[];
    required_permissions?: string[];
  }>;
  
  // Loading States
  loading: {
    list: boolean;
    link: boolean;
    unlink: boolean;
    myAccess: boolean;
    userAccess: boolean;
  };
  
  error: string | null;
  initialized: boolean;
  
  // Pagination
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
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
};

// ==================== ASYNC THUNKS ====================

export const fetchMenuPermissions = createAsyncThunk(
  'menuPermissions/fetchMenuPermissions',
  async (params: ListMenuPermissionsParams, { rejectWithValue }) => {
    try {
      const response = await RbacService.listMenuPermissions(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch menu permissions');
    }
  }
);

export const fetchAllPermissions = createAsyncThunk(
  'menuPermissions/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await RbacService.getAllPermissions();
      return response.data.permissionsList;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch permissions');
    }
  }
);

export const linkMenuPermission = createAsyncThunk(
  'menuPermissions/linkMenuPermission',
  async (payload: LinkMenuPermissionPayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.linkMenuPermission(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to link menu permission');
    }
  }
);

export const bulkLinkMenuPermissions = createAsyncThunk(
  'menuPermissions/bulkLinkMenuPermissions',
  async (payload: BulkLinkMenuPermissionsPayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.bulkLinkMenuPermissions(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to bulk link menu permissions');
    }
  }
);

export const unlinkMenuPermission = createAsyncThunk(
  'menuPermissions/unlinkMenuPermission',
  async (payload: { menuKey: string; permissionId: number }, { rejectWithValue }) => {
    try {
      const response = await RbacService.unlinkMenuPermission(payload);
      return { ...response.data, menuKey: payload.menuKey, permissionId: payload.permissionId };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to unlink menu permission');
    }
  }
);

export const fetchMyAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchMyAccessibleMenus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await RbacService.getMyAccessibleMenus();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch accessible menus');
    }
  }
);

export const fetchUserAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchUserAccessibleMenus',
  async (userId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await RbacService.getUserAccessibleMenus(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch user accessible menus');
    }
  }
);

export const checkMenuAccess = createAsyncThunk(
  'menuPermissions/checkMenuAccess',
  async (payload: { menuKey: string; userId?: number }, { rejectWithValue }) => {
    try {
      const response = await RbacService.checkMenuAccess(payload.menuKey, payload.userId);
      return response.data;
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
  },
  extraReducers: (builder) => {
    // Fetch Menu Permissions List
    builder
      .addCase(fetchMenuPermissions.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchMenuPermissions.fulfilled, (state, action) => {
        state.loading.list = false;
        state.menuPermissions = action.payload.menuPermissionsList;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchMenuPermissions.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload as string;
      });

    // Fetch All Permissions
    builder
      .addCase(fetchAllPermissions.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        state.allPermissions = action.payload;
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Link Menu Permission
    builder
      .addCase(linkMenuPermission.pending, (state) => {
        state.loading.link = true;
        state.error = null;
      })
      .addCase(linkMenuPermission.fulfilled, (state, action) => {
        state.loading.link = false;
        // Add or update in list
        const index = state.menuPermissions.findIndex(
          mp => mp.menu_key === action.payload.menu_key && 
                mp.permission_id === action.payload.permission_id
        );
        if (index !== -1) {
          state.menuPermissions[index] = action.payload;
        } else {
          state.menuPermissions.unshift(action.payload);
        }
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
        // Merge new permissions into list
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
      .addCase(fetchUserAccessibleMenus.fulfilled, (state, action) => {
        state.loading.userAccess = false;
        // Store in separate state if needed
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
      .addCase(checkMenuAccess.fulfilled, (state) => {
        // Result handled by caller
      })
      .addCase(checkMenuAccess.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================

export const { clearError, setMenuAccess, resetMenuPermissions } = menuPermissionsSlice.actions;

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