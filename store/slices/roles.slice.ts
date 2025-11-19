// store/slices/roles.slice.ts - UPDATED WITH BACKEND DTO ALIGNMENT
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  RbacService,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  ListParams,
  PermissionTree,
  BulkAssignRolesPayload,
  BulkRemoveRolesPayload,
  BulkAssignUsersToRolePayload,
  CloneRolePayload,
  CompareRolesPayload
} from '@/lib/api/services/rbac-service';
import { RootState } from '../store';

interface RolesState {
  roles: Role[];
  currentRole: Role | null;
  permissionsTree: PermissionTree | null;
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

// ==================== ASYNC THUNKS ====================

export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (filters: ListParams, { rejectWithValue }) => {
    try {
      const response = await RbacService.listRoles(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch roles');
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
      return rejectWithValue(error?.message || 'Failed to fetch role');
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
      return rejectWithValue(error?.message || 'Failed to create role');
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
      return rejectWithValue(error?.message || 'Failed to update role');
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
      return rejectWithValue(error?.message || 'Failed to delete role');
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

// If you have a separate action for listing permissions:
export const fetchPermissions = createAsyncThunk(
  'permissions/fetchList',
  async (params: { page?: number; limit?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await RbacService.listPermissions({
        page: params.page || 1,
        limit: params.limit || 100,
        //@ts-ignore
        search: params.search || '',
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

export const bulkAssignRolePermissions = createAsyncThunk(
  'roles/bulkAssignRolePermissions',
  async (
    { roleId, changes }: { roleId: number; changes: Array<{ mode: 'I' | 'D'; permissionId: number }> },
    { rejectWithValue }
  ) => {
    try {
      const response = await RbacService.bulkAssignRolePermissions(roleId, changes);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update permissions');
    }
  }
);

// ==================== ENHANCED OPERATIONS ====================

export const bulkAssignRolesToUser = createAsyncThunk(
  'roles/bulkAssignRolesToUser',
  async (payload: BulkAssignRolesPayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.bulkAssignRolesToUser(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to bulk assign roles');
    }
  }
);

export const bulkRemoveRolesFromUser = createAsyncThunk(
  'roles/bulkRemoveRolesFromUser',
  async (payload: BulkRemoveRolesPayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.bulkRemoveRolesFromUser(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to bulk remove roles');
    }
  }
);

export const bulkAssignUsersToRole = createAsyncThunk(
  'roles/bulkAssignUsersToRole',
  async (payload: BulkAssignUsersToRolePayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.bulkAssignUsersToRole(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to bulk assign users');
    }
  }
);

export const cloneRole = createAsyncThunk(
  'roles/cloneRole',
  async (payload: CloneRolePayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.cloneRole(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to clone role');
    }
  }
);

export const compareRoles = createAsyncThunk(
  'roles/compareRoles',
  async (payload: CompareRolesPayload, { rejectWithValue }) => {
    try {
      const response = await RbacService.compareRoles(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to compare roles');
    }
  }
);

// ==================== SELECTORS ====================

export const selectRoleById = createSelector(
  [
    (state: RootState) => state.roles.roles,
    (_: RootState, roleId: number) => roleId
  ],
  (roles, roleId) => roles.find(r => r.id === roleId)
);

export const selectSystemRoles = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.filter(r => r.is_system_role)
);

export const selectTenantRoles = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.filter(r => !r.is_system_role)
);

export const selectRolesByHierarchy = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => [...roles].sort((a, b) => (b.hierarchy_level || 0) - (a.hierarchy_level || 0))
);

export const selectDefaultRoles = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.filter(r => r.is_default)
);

export const selectRolesWithStats = createSelector(
  [(state: RootState) => state.roles.roles],
  (roles) => roles.map(role => ({
    ...role,
    hasPermissions: (role.permissions_count || 0) > 0,
    hasUsers: (role.users_count || 0) > 0,
  }))
);

export const selectIsPermissionsTreeLoaded = createSelector(
  [(state: RootState) => state.roles.permissionsTree],
  (tree) => tree !== null
);

export const selectPermissionsTreeSummary = createSelector(
  [(state: RootState) => state.roles.permissionsTree],
  (tree) => tree?.summary || {
    total_permissions: 0,
    assigned_permissions: 0,
    total_categories: 0,
  }
);

// ==================== SLICE ====================

// ==================== SLICE ====================

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
        // ✅ KEEP ONLY THIS ONE with safe access
        if (state.currentRole && action.payload?.current_total_permissions !== undefined) {
          state.currentRole.permissions_count = action.payload.current_total_permissions;
        }
      })
      .addCase(bulkAssignRolePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Bulk Assign Roles to User
    builder
      .addCase(bulkAssignRolesToUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAssignRolesToUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(bulkAssignRolesToUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Bulk Remove Roles from User
    builder
      .addCase(bulkRemoveRolesFromUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkRemoveRolesFromUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(bulkRemoveRolesFromUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Bulk Assign Users to Role
    builder
      .addCase(bulkAssignUsersToRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAssignUsersToRole.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(bulkAssignUsersToRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Clone Role
    builder
      .addCase(cloneRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cloneRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles.unshift(action.payload.newRole);
      })
      .addCase(cloneRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Compare Roles
    builder
      .addCase(compareRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(compareRoles.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(compareRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // ❌ REMOVE THE DUPLICATE BELOW - IT WAS ADDED AT THE END
  },
});

// ==================== EXPORTS ====================

export const { clearCurrentRole, clearError } = rolesSlice.actions;

// Basic Selectors
export const selectRoles = (state: RootState) => state.roles.roles;
export const selectCurrentRole = (state: RootState) => state.roles.currentRole;
export const selectPermissionsTree = (state: RootState) => state.roles.permissionsTree;
export const selectRolesLoading = (state: RootState) => state.roles.loading;
export const selectRolesError = (state: RootState) => state.roles.error;
export const selectRolesPagination = (state: RootState) => state.roles.pagination;

export default rolesSlice.reducer;