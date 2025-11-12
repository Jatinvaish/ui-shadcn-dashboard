// store/slices/roles.slice.ts
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RbacService, Role, CreateRolePayload, UpdateRolePayload, ListParams } from '@/lib/api/services/rbac-service';
import { RootState } from '../store';

interface RolesState {
  roles: Role[];
  currentRole: Role | null;
  permissionsTree: any | null;
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

const initialState: RolesState = {
  roles: [],
  currentRole: null,
  permissionsTree: null,
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

// Async Thunks
export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (filters: ListParams, { rejectWithValue }) => {
    try {
      const response = await RbacService.listRoles(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

export const fetchRoleById = createAsyncThunk(
  'roles/fetchRoleById',
  async (roleId: number, { rejectWithValue }) => {
    try {
      const response = await RbacService.getRole(roleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch role');
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/createRole',
  async (payload: CreateRolePayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.createRole(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create role');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async (payload: UpdateRolePayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.updateRole(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update role');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (roleId: number, { rejectWithValue }) => {
    try {
      await RbacService.deleteRole(roleId);
      return roleId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete role');
    }
  }
);

export const fetchRolePermissionsTree = createAsyncThunk(
  'roles/fetchRolePermissionsTree',
  async (roleId: number, { rejectWithValue }) => {
    try {
      const response = await RbacService.getRolePermissionsTree(roleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions tree');
    }
  }
);

export const bulkAssignRolePermissions = createAsyncThunk(
  'roles/bulkAssignRolePermissions',
  async ({ roleId, changes }: { roleId: number; changes: Array<{ mode: 'I' | 'D'; permissionId: number }> }, { rejectWithValue }) => {
    try {
      const response = await RbacService.bulkAssignRolePermissions(roleId, changes);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update permissions');
    }
  }
);
export const selectRoleById = createSelector(
  [
    (state: RootState) => state.roles.roles,
    (_: RootState, roleId: number) => roleId
  ],
  (roles, roleId) => roles.find(r => r.id === roleId)
);

/**
 * Select system roles only
 */
export const selectSystemRoles = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.filter(r => r.is_system_role)
);

/**
 * Select tenant-specific roles only
 */
export const selectTenantRoles = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.filter(r => !r.is_system_role)
);

/**
 * Select roles sorted by hierarchy (highest first)
 */
export const selectRolesByHierarchy = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => [...roles].sort((a, b) => b.hierarchy_level - a.hierarchy_level)
);

/**
 * Select default roles
 */
export const selectDefaultRoles = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.filter(r => r?.is_default)
);

/**
 * Select roles with permission counts
 */
export const selectRolesWithStats = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.map(role => ({
    ...role,
    hasPermissions: (role.permissions_count || 0) > 0,
    hasUsers: (role.users_count || 0) > 0,
  }))
);

/**
 * Check if current role permissions tree is loaded
 */
export const selectIsPermissionsTreeLoaded = createSelector(
  [(state: RootState) => state.roles.permissionsTree],
  (tree) => tree !== null
);

/**
 * Get permission tree summary
 */
export const selectPermissionsTreeSummary = createSelector(
  [(state: RootState) => state.roles.permissionsTree],
  (tree) => tree?.summary || {
    total_permissions: 0,
    assigned_permissions: 0,
    total_categories: 0,
  }
);

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearCurrentRole: (state) => {
      state.currentRole = null;
      state.permissionsTree = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Roles
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload.rolesList;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Role By ID
    builder
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRole = action.payload;
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Role
    builder
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles.unshift(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Role
    builder
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roles.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        if (state.currentRole?.id === action.payload.id) {
          state.currentRole = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Role
    builder
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter(r => r.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Permissions Tree
    builder
      .addCase(fetchRolePermissionsTree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolePermissionsTree.fulfilled, (state, action) => {
        state.loading = false;
        state.permissionsTree = action.payload;
      })
      .addCase(fetchRolePermissionsTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Bulk Assign Permissions
    builder
      .addCase(bulkAssignRolePermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAssignRolePermissions.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(bulkAssignRolePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentRole, clearError } = rolesSlice.actions;
export default rolesSlice.reducer;

// Selectors
export const selectRoles = (state: { roles: RolesState }) => state.roles.roles;
export const selectCurrentRole = (state: { roles: RolesState }) => state.roles.currentRole;
export const selectPermissionsTree = (state: { roles: RolesState }) => state.roles.permissionsTree;
export const selectRolesLoading = (state: { roles: RolesState }) => state.roles.loading;
export const selectRolesError = (state: { roles: RolesState }) => state.roles.error;
export const selectRolesPagination = (state: { roles: RolesState }) => state.roles.pagination;