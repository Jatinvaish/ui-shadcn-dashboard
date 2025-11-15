// store/slices/permissions.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RbacService, Permission, CreatePermissionPayload, ListParams } from '@/lib/api/services/rbac-service';

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
};

export const fetchPermissions = createAsyncThunk(
  'permissions/fetchPermissions',
  async (filters: ListParams, { rejectWithValue }) => {
    try {
      const response = await RbacService.listPermissions(filters);
      return response.data;
    } catch (error: any) {
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload.permissionsList;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions.unshift(action.payload);
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
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = permissionsSlice.actions;
export default permissionsSlice.reducer;

export const selectPermissions = (state: { permissions: PermissionsState }) => state.permissions.permissions;
export const selectPermissionsLoading = (state: { permissions: PermissionsState }) => state.permissions.loading;
export const selectPermissionsError = (state: { permissions: PermissionsState }) => state.permissions.error;
export const selectPermissionsPagination = (state: { permissions: PermissionsState }) => state.permissions.pagination;