// store/slices/menu-permissions.slice.ts - FIXED & ALIGNED WITH BACKEND
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import { RbacService } from '@/lib/api';

// ==================== TYPE DEFINITIONS ====================
export interface UserPermission {
  id: number;
  permission_key: string;
  resource: string;
  action: string;
  category: string;
  description?: string;
  is_super_admin?: boolean;
}

export interface MenuPermission {
  id: number;
  menu_key: string;
  permission_id: number;
  permission_key: string;
  resource?: string;
  action?: string;
  category?: string;
  is_required: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BlockedMenu {
  menu_key: string;
  missing_permissions: string;
  block_reason: string;
}

interface MenuPermissionsState {
  // User's accessible menus (for navigation/routing)
  accessibleMenus: string[];
  userPermissions: UserPermission[];
  blockedMenus: any[];
  
  // Menu permission management (CRUD)
  menuPermissions: MenuPermission[];
  allPermissions: any[];
  
  // Loading states
  loading: boolean;
  crudLoading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: MenuPermissionsState = {
  accessibleMenus: [],
  userPermissions: [],
  blockedMenus: [],
  menuPermissions: [],
  allPermissions: [],
  loading: false,
  crudLoading: false,
  error: null,
  initialized: false,
};

// ==================== HELPER FUNCTIONS ====================
function getActualAccessibleMenus(
  accessibleMenus: string[],
  blockedMenus: string[]
): string[] {
  if (!blockedMenus || blockedMenus.length === 0) {
    return accessibleMenus;
  }
  const blockedSet = new Set(blockedMenus);
  return accessibleMenus.filter(menu => !blockedSet.has(menu));
}

// ==================== THUNKS ====================

/**
 * Fetch user's accessible menus (for routing/navigation)
 */
export const fetchMyAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchMyAccessibleMenus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching my accessible menus...');
      
      const response:any = await RbacService.getMyAccessibleMenus();
      
      if (!response?.data) {
        throw new Error('Invalid API response');
      }

      const data = response.data;
      
      // Extract data from response
      const userPermissions = Array.isArray(data.userPermissions) 
        ? data.userPermissions 
        : [];
      
      const rawAccessibleMenus = Array.isArray(data.accessibleMenus) 
        ? data.accessibleMenus 
        : [];
      
      const blockedMenusData = Array.isArray(data.blockedMenus) 
        ? data.blockedMenus 
        : [];

      // Extract blocked menu keys
      const blockedMenuKeys = blockedMenusData.map((bm: any) => 
        typeof bm === 'string' ? bm : bm.menu_key
      );

      // Calculate actual accessible menus
      const actualAccessibleMenus = getActualAccessibleMenus(
        rawAccessibleMenus,
        blockedMenuKeys
      );

      const result = {
        accessibleMenus: actualAccessibleMenus,
        userPermissions: userPermissions,
        blockedMenus: blockedMenuKeys,
      };

      console.log('✅ My accessible menus fetched:', {
        accessible: result.accessibleMenus.length,
        permissions: result.userPermissions.length,
        blocked: result.blockedMenus.length,
      });

      return result;
    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      
      if (error.response?.status === 401) {
        return rejectWithValue('Not authenticated');
      }
      
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch menus'
      );
    }
  }
);

/**
 * Fetch menu permissions list (for management page)
 */
export const fetchMenuPermissions = createAsyncThunk(
  'menuPermissions/fetchMenuPermissions',
  async (
    params: { page?: number; limit?: number; menuKey?: string; search?: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔄 Fetching menu permissions list...', params);
      
      const response:any = await RbacService.listMenuPermissions(params);
      
      if (!response?.data) {
        throw new Error('Invalid API response');
      }

      const menuPermissions = response.data.menuPermissionsList || [];

      console.log('✅ Menu permissions list fetched:', menuPermissions.length);

      return { menuPermissions };
    } catch (error: any) {
      console.error('❌ API error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch menu permissions'
      );
    }
  }
);

/**
 * Fetch permissions for a specific menu
 */
export const fetchMenuPermissionsByKey = createAsyncThunk(
  'menuPermissions/fetchMenuPermissionsByKey',
  async (menuKey: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching permissions for menu:', menuKey);
      
      const response = await RbacService.getMenuPermissions(menuKey);
      
      if (!response?.data) {
        throw new Error('Invalid API response');
      }

      console.log('✅ Menu permissions fetched for:', menuKey);

      return response.data;
    } catch (error: any) {
      console.error('❌ API error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch menu permissions'
      );
    }
  }
);

/**
 * Fetch all permissions (for dropdown in link dialog)
 */
export const fetchAllPermissions = createAsyncThunk(
  'menuPermissions/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching all permissions...');
      
      const response:any = await RbacService.listPermissions({
        page: 1,
        limit: 100,
      });
      
      if (!response?.data) {
        throw new Error('Invalid API response');
      }

      const permissions = response.data.permissionsList || [];

      console.log('✅ All permissions fetched:', permissions.length);

      return permissions;
    } catch (error: any) {
      console.error('❌ API error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch permissions'
      );
    }
  }
);

/**
 * Link menu permission
 */
export const linkMenuPermission = createAsyncThunk(
  'menuPermissions/linkMenuPermission',
  async (
    payload: { menuKey: string; permissionId: number; isRequired?: boolean },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔄 Linking menu permission...', payload);
      
      const response = await RbacService.linkMenuPermission(payload);
      
      if (!response?.data) {
        throw new Error('Invalid API response');
      }

      console.log('✅ Menu permission linked');

      return response.data;
    } catch (error: any) {
      console.error('❌ API error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to link permission'
      );
    }
  }
);

/**
 * Bulk link menu permissions
 */
export const bulkLinkMenuPermissions = createAsyncThunk(
  'menuPermissions/bulkLinkMenuPermissions',
  async (
    payload: {
      mappings: Array<{
        menuKey: string;
        permissionId: number;
        isRequired?: boolean;
      }>;
    },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔄 Bulk linking menu permissions...', payload);
      
      const response = await RbacService.bulkLinkMenuPermissions(payload);
      
      if (!response?.success) {
        throw new Error('Invalid API response');
      }

      console.log('✅ Menu permissions bulk linked');

      return response;
    } catch (error: any) {
      console.error('❌ API error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to bulk link permissions'
      );
    }
  }
);

/**
 * Unlink menu permission
 */
export const unlinkMenuPermission = createAsyncThunk(
  'menuPermissions/unlinkMenuPermission',
  async (
    payload: { menuKey: string; permissionId: number },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔄 Unlinking menu permission...', payload);
      
      const response = await RbacService.unlinkMenuPermission(payload);
      
      if (!response?.success) {
        throw new Error('Invalid API response');
      }

      console.log('✅ Menu permission unlinked');

      return { menuKey: payload.menuKey, permissionId: payload.permissionId };
    } catch (error: any) {
      console.error('❌ API error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to unlink permission'
      );
    }
  }
);

/**
 * Check menu access for current user
 */
export const checkMenuAccess = createAsyncThunk(
  'menuPermissions/checkMenuAccess',
  async (menuKey: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Checking menu access for:', menuKey);
      
      const response:any = await RbacService.checkMenuAccess(menuKey);
      
      if (!response?.data) {
        throw new Error('Invalid API response');
      }

      console.log('✅ Menu access checked:', response.data.hasAccess);

      return { menuKey, hasAccess: response.data.canAccess };
    } catch (error: any) {
      console.error('❌ API error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to check menu access'
      );
    }
  }
);

// ==================== SLICE ====================
const menuPermissionsSlice = createSlice({
  name: 'menuPermissions',
  initialState,
  reducers: {
    setMenuAccess: (
      state,
      action: PayloadAction<{
        accessibleMenus: string[];
        userPermissions: UserPermission[];
        blockedMenus?: string[];
      }>
    ) => {
      let finalAccessibleMenus = action.payload.accessibleMenus;
      
      if (action.payload.blockedMenus?.length) {
        finalAccessibleMenus = getActualAccessibleMenus(
          action.payload.accessibleMenus,
          action.payload.blockedMenus
        );
      }
      
      state.accessibleMenus = finalAccessibleMenus;
      state.userPermissions = action.payload.userPermissions;
      state.blockedMenus = action.payload.blockedMenus || [];
      state.initialized = true;
      state.loading = false;
      state.error = null;
    },

    clearMenuPermissions: (state) => {
      Object.assign(state, initialState);
    },

    clearMenuError: (state) => {
      state.error = null;
    },

    addMenuPermission: (state, action: PayloadAction<MenuPermission>) => {
      state.menuPermissions.unshift(action.payload);
    },

    removeMenuPermission: (
      state,
      action: PayloadAction<{ menuKey: string; permissionId: number }>
    ) => {
      state.menuPermissions = state.menuPermissions.filter(
        (mp) =>
          !(
            mp.menu_key === action.payload.menuKey &&
            mp.permission_id === action.payload.permissionId
          )
      );
    },

    updateMenuPermission: (state, action: PayloadAction<MenuPermission>) => {
      const index = state.menuPermissions.findIndex(
        (mp) =>
          mp.menu_key === action.payload.menu_key &&
          mp.permission_id === action.payload.permission_id
      );
      if (index !== -1) {
        state.menuPermissions[index] = action.payload;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ==================== fetchMyAccessibleMenus ====================
      .addCase(fetchMyAccessibleMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('⏳ Fetching my accessible menus...');
      })
      .addCase(fetchMyAccessibleMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.accessibleMenus = action.payload.accessibleMenus;
        state.userPermissions = action.payload.userPermissions;
        state.blockedMenus = action.payload.blockedMenus;
        state.initialized = true;
        state.error = null;
        
        console.log('✅ My accessible menus stored:', {
          accessible: state.accessibleMenus.length,
          permissions: state.userPermissions.length,
          blocked: state.blockedMenus.length,
        });
      })
      .addCase(fetchMyAccessibleMenus.rejected, (state, action) => {
        state.loading = false;
        const errorMessage = action.payload as string;
        
        if (errorMessage !== 'Not authenticated') {
          state.error = errorMessage;
        }
        
        state.initialized = true;
        console.log('❌ My accessible menus rejected:', errorMessage);
      })

      // ==================== fetchMenuPermissions ====================
      .addCase(fetchMenuPermissions.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuPermissions.fulfilled, (state, action) => {
        state.crudLoading = false;
        state.menuPermissions = action.payload.menuPermissions;
        state.error = null;
      })
      .addCase(fetchMenuPermissions.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })

      // ==================== fetchMenuPermissionsByKey ====================
      .addCase(fetchMenuPermissionsByKey.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuPermissionsByKey.fulfilled, (state) => {
        state.crudLoading = false;
        state.error = null;
      })
      .addCase(fetchMenuPermissionsByKey.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })

      // ==================== fetchAllPermissions ====================
      .addCase(fetchAllPermissions.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        state.crudLoading = false;
        state.allPermissions = action.payload;
        state.error = null;
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })

      // ==================== linkMenuPermission ====================
      .addCase(linkMenuPermission.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(linkMenuPermission.fulfilled, (state) => {
        state.crudLoading = false;
        state.error = null;
      })
      .addCase(linkMenuPermission.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })

      // ==================== bulkLinkMenuPermissions ====================
      .addCase(bulkLinkMenuPermissions.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(bulkLinkMenuPermissions.fulfilled, (state) => {
        state.crudLoading = false;
        state.error = null;
      })
      .addCase(bulkLinkMenuPermissions.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })

      // ==================== unlinkMenuPermission ====================
      .addCase(unlinkMenuPermission.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(unlinkMenuPermission.fulfilled, (state, action) => {
        state.crudLoading = false;
        state.error = null;
        // Remove the unlinked item from the list
        state.menuPermissions = state.menuPermissions.filter(
          (mp) =>
            !(
              mp.menu_key === action.payload.menuKey &&
              mp.permission_id === action.payload.permissionId
            )
        );
      })
      .addCase(unlinkMenuPermission.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })

      // ==================== checkMenuAccess ====================
      .addCase(checkMenuAccess.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(checkMenuAccess.fulfilled, (state) => {
        state.crudLoading = false;
        state.error = null;
      })
      .addCase(checkMenuAccess.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================
export const {
  setMenuAccess,
  clearMenuPermissions,
  clearMenuError,
  addMenuPermission,
  removeMenuPermission,
  updateMenuPermission,
} = menuPermissionsSlice.actions;

// Selectors for user's accessible menus (routing/navigation)
export const selectAccessibleMenus = (state: RootState) =>
  state.menuPermissions.accessibleMenus;
export const selectUserPermissions = (state: RootState) =>
  state.menuPermissions.userPermissions;
export const selectBlockedMenus = (state: RootState) =>
  state.menuPermissions.blockedMenus;
export const selectMenuPermissionsInitialized = (state: RootState) =>
  state.menuPermissions.initialized;

// Selectors for menu permission management (CRUD page)
export const selectMenuPermissions = (state: RootState) =>
  state.menuPermissions.menuPermissions;
export const selectAllPermissions = (state: RootState) =>
  state.menuPermissions.allPermissions;
export const selectMenuPermissionsLoading = (state: RootState) =>
  state.menuPermissions.crudLoading;

// General selectors
export const selectMenuPermissionsError = (state: RootState) =>
  state.menuPermissions.error;
export const selectMenuPermissionsLoadingAny = (state: RootState) =>
  state.menuPermissions.loading || state.menuPermissions.crudLoading;

// Helper selector: Check if user can access a specific menu
export const selectCanAccessMenu = (menuKey: string) => (state: RootState) => {
  return state.menuPermissions.accessibleMenus.includes(menuKey);
};

// Helper selector: Check if user has a specific permission
export const selectHasPermission =
  (permissionKey: string) => (state: RootState) => {
    return state.menuPermissions.userPermissions.some(
      (perm) => perm.permission_key === permissionKey
    );
  };

export default menuPermissionsSlice.reducer;