// store/slices/permissions.slice.ts - FIXED VERSION
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RbacService, Permission, CreatePermissionPayload } from '@/lib/api/services/rbac-service';

interface PermissionsState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  // ✅ Add cache tracking
  lastFetchParams: string | null;
}

const initialState: PermissionsState = {
  permissions: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  lastFetchParams: null,
};

// ✅ FIX: Add proper params type with scope
export const fetchPermissions = createAsyncThunk(
  'permissions/fetchPermissions',
  async (params: {
    page?: number;
    limit?: number;
    category?: string;
    scope?: 'all' | 'system' | 'custom';
  }, { getState, rejectWithValue }) => {
    try {
      // ✅ Create cache key
      const cacheKey = JSON.stringify(params);
      const state = getState() as { permissions: PermissionsState };
      
      // ✅ Prevent duplicate calls
      if (state.permissions.lastFetchParams === cacheKey && state.permissions.loading) {
        console.log('🚫 Duplicate fetchPermissions prevented:', params);
        return rejectWithValue('Duplicate request');
      }

      console.log('📡 Fetching permissions with params:', params);
      const response = await RbacService.listPermissions({
        page: params.page || 1,
        limit: params.limit || 100,
        category: params.category,
        scope: params.scope || 'all', // ✅ Default to 'all'
      });
      
      console.log('✅ Permissions fetched:', response.data.permissionsList.length);
      return { data: response.data, cacheKey };
    } catch (error: any) {
      console.error('❌ fetchPermissions error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

export const createPermission = createAsyncThunk(
  'permissions/createPermission',
  async (payload: CreatePermissionPayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.createPermission(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create permission');
    }
  }
);

export const deletePermission = createAsyncThunk(
  'permissions/deletePermission',
  async (permissionId: number, { rejectWithValue }) => {
    try {
      await RbacService.deletePermission(permissionId);
      return permissionId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete permission');
    }
  }
);

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // ✅ Add reset action
    resetPermissions: (state) => {
      state.permissions = [];
      state.lastFetchParams = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        // ✅ Handle rejected duplicate requests
        //todo
        //@ts-ignore
        if (action.payload === 'Duplicate request') {
          state.loading = false;
          return;
        }
        
        state.loading = false;
        state.permissions = action.payload.data.permissionsList;
        state.pagination = action.payload.data.meta;
        state.lastFetchParams = action.payload.cacheKey; // ✅ Store cache key
        console.log('✅ Permissions state updated:', state.permissions.length);
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        // ✅ Don't set error for duplicate requests
        if (action.payload !== 'Duplicate request') {
          state.error = action.payload as string;
          console.error('❌ Permissions fetch failed:', action.payload);
        }
      })
      .addCase(createPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions.unshift(action.payload);
        // ✅ Invalidate cache
        state.lastFetchParams = null;
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = state.permissions.filter(p => p.id !== action.payload);
        // ✅ Invalidate cache
        state.lastFetchParams = null;
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;

export const selectPermissions = (state: { permissions: PermissionsState }) => state.permissions.permissions;
export const selectPermissionsLoading = (state: { permissions: PermissionsState }) => state.permissions.loading;
export const selectPermissionsError = (state: { permissions: PermissionsState }) => state.permissions.error;
export const selectPermissionsPagination = (state: { permissions: PermissionsState }) => state.permissions.pagination;