// store/slices/menu-permissions.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RbacService, MenuPermission, Permission, ListMenuPermissionsParams } from '@/lib/api/services/rbac-service';

interface MenuPermissionsState {
  // User-specific menu access
  userPermissions: any[];
  accessibleMenus: string[];
  blockedMenus: any[];
  initialized: boolean;
  
  // Management/Admin features
  menuPermissions: MenuPermission[];
  allPermissions: Permission[];
  
  // Shared state
  loading: boolean;
  error: string | null;
  
  // Pagination for management view
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
  // User-specific
  userPermissions: [],
  accessibleMenus: [],
  blockedMenus: [],
  initialized: false,
  
  // Management
  menuPermissions: [],
  allPermissions: [],
  
  // Shared
  loading: false,
  error: null,
  
  // Pagination
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

// ============================================================================
// ASYNC THUNKS - User Menu Access
// ============================================================================

// Fetch current user's accessible menus on login (NO AUTH CHECK)
export const fetchMyAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchMyAccessibleMenus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await RbacService.getMyAccessibleMenus();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu permissions');
    }
  }
);

// Fetch another user's accessible menus (requires permission)
export const fetchUserAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchUserAccessibleMenus',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await RbacService.getUserAccessibleMenus(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user menu permissions');
    }
  }
);

// ============================================================================
// ASYNC THUNKS - Management/Admin
// ============================================================================

// Fetch all menu permissions (management view)
export const fetchMenuPermissions = createAsyncThunk(
  'menuPermissions/fetchMenuPermissions',
  async (params: ListMenuPermissionsParams, { rejectWithValue }) => {
    try {
      const response = await RbacService.listMenuPermissions(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu permissions');
    }
  }
);

// Fetch all available permissions
export const fetchAllPermissions = createAsyncThunk(
  'menuPermissions/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await RbacService.listPermissions({ limit: 1000 });
      return response.data.permissionsList;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

// Link a permission to a menu
export const linkMenuPermission = createAsyncThunk(
  'menuPermissions/linkMenuPermission',
  async (payload: { menuKey: string; permissionId: number; isRequired?: boolean }, { rejectWithValue }) => {
    try {
      const response = await RbacService.linkMenuPermission(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to link permission');
    }
  }
);

// Unlink a permission from a menu
export const unlinkMenuPermission = createAsyncThunk(
  'menuPermissions/unlinkMenuPermission',
  async ({ menuKey, permissionId }: { menuKey: string; permissionId: number }, { rejectWithValue }) => {
    try {
      await RbacService.unlinkMenuPermission(menuKey, permissionId);
      return { menuKey, permissionId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unlink permission');
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const menuPermissionsSlice = createSlice({
  name: 'menuPermissions',
  initialState,
  reducers: {
    clearMenuPermissions: (state) => {
      state.userPermissions = [];
      state.accessibleMenus = [];
      state.blockedMenus = [];
      state.initialized = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ========================================================================
    // Fetch My Accessible Menus
    // ========================================================================
    builder
      .addCase(fetchMyAccessibleMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAccessibleMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.userPermissions = action.payload.userPermissions || [];
        state.accessibleMenus = action.payload.accessibleMenus || [];
        state.blockedMenus = action.payload.blockedMenus || [];
        state.initialized = true;
      })
      .addCase(fetchMyAccessibleMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initialized = true;
      });

    // ========================================================================
    // Fetch User Accessible Menus
    // ========================================================================
    builder
      .addCase(fetchUserAccessibleMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAccessibleMenus.fulfilled, (state, action) => {
        state.loading = false;
        // Don't override current user's permissions, just store for reference
      })
      .addCase(fetchUserAccessibleMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // Fetch Menu Permissions (Management)
    // ========================================================================
    builder
      .addCase(fetchMenuPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.menuPermissions = action.payload.menuPermissionsList;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchMenuPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // Fetch All Permissions
    // ========================================================================
    builder
      .addCase(fetchAllPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.allPermissions = action.payload;
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // Link Menu Permission
    // ========================================================================
    builder
      .addCase(linkMenuPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(linkMenuPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.menuPermissions.unshift(action.payload);
      })
      .addCase(linkMenuPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // Unlink Menu Permission
    // ========================================================================
    builder
      .addCase(unlinkMenuPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unlinkMenuPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.menuPermissions = state.menuPermissions.filter(
          mp => !(mp.menu_key === action.payload.menuKey && mp.permission_id === action.payload.permissionId)
        );
      })
      .addCase(unlinkMenuPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const { clearMenuPermissions, clearError } = menuPermissionsSlice.actions;
export default menuPermissionsSlice.reducer;

// ============================================================================
// SELECTORS - User Menu Access
// ============================================================================

export const selectUserPermissions = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.userPermissions;

export const selectAccessibleMenus = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.accessibleMenus;

export const selectBlockedMenus = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.blockedMenus;

export const selectMenuPermissionsInitialized = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.initialized;

// ============================================================================
// SELECTORS - Management/Admin
// ============================================================================

export const selectMenuPermissions = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.menuPermissions;

export const selectAllPermissions = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.allPermissions;

export const selectMenuPermissionsPagination = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.pagination;

// ============================================================================
// SELECTORS - Shared
// ============================================================================

export const selectMenuPermissionsLoading = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.loading;

export const selectMenuPermissionsError = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.error;