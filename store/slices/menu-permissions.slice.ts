// store/slices/menu-permissions.slice.ts - FIXED WITH BETTER ERROR HANDLING
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import { RbacService } from '@/lib/api';

// ==================== TYPE DEFINITIONS ====================
interface BlockedMenu {
  menu_key: string;
  missing_permissions?: string;
  block_reason?: string;
}

interface UserPermission {
  id: number;
  permission_key: string;
  resource: string;
  action: string;
  category?: string;
  description?: string;
  is_super_admin?: boolean;
}

interface MenuPermission {
  id: number;
  menu_key: string;
  permission_id: number;
  permission_key: string;
  resource?: string;
  action?: string;
  category?: string;
  is_required: boolean;
  is_system_permission: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
}

interface Permission {
  id: number;
  permission_key: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
  is_system_permission: boolean;
  created_at: string;
  updated_at?: string;
}

interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface MenuPermissionsState {
  accessibleMenus: string[];
  userPermissions: UserPermission[];
  blockedMenus: any[];
  menuPermissions: MenuPermission[];
  allPermissions: Permission[];
  pagination: PaginationMeta | null;
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
  pagination: null,
  loading: false,
  crudLoading: false,
  error: null,
  initialized: false,
};

// ==================== HELPER FUNCTIONS ====================
function getActualAccessibleMenus(
  accessibleMenus: string[],
  blockedMenus: BlockedMenu[]
): string[] {
  const blockedSet = new Set(blockedMenus.map(bm => bm.menu_key));
  return accessibleMenus.filter(menu => !blockedSet.has(menu));
}

function extractResponseData(response: any): any {
  console.log('🔍 Extracting response data:', response);
  
  // If response is null/undefined, return empty object
  if (!response) {
    console.warn('⚠️ Response is null/undefined');
    return {};
  }

  // Try different response structures
  let data = response;
  
  // Check for response.data
  if (response.data) {
    data = response.data;
    console.log('📦 Found response.data:', data);
  }
  
  // Check for nested data.data
  if (data?.data) {
    data = data.data;
    console.log('📦 Found data.data:', data);
  }

  // Check for success wrapper
  if (data?.success && data?.data) {
    data = data.data;
    console.log('📦 Found success wrapper:', data);
  }

  return data || {};
}

// ==================== THUNKS ====================

/**
 * Fetch user's accessible menus (for routing/navigation)
 */
export const fetchMyAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchMyAccessibleMenus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 API: Fetching my accessible menus...');
      
      const response = await RbacService.getMyAccessibleMenus();
      console.log('📦 Raw Response:', response);
      
      const data = extractResponseData(response);
      console.log('📦 Extracted Data:', data);
      
      // Extract arrays with multiple fallback strategies
      const rawAccessibleMenus = 
        Array.isArray(data?.accessibleMenus) ? data.accessibleMenus :
        Array.isArray(data?.accessible_menus) ? data.accessible_menus :
        Array.isArray(data?.menus) ? data.menus :
        Array.isArray(data) ? data :
        [];
          
      const rawBlockedMenus = 
        Array.isArray(data?.blockedMenus) ? data.blockedMenus :
        Array.isArray(data?.blocked_menus) ? data.blocked_menus :
        [];
        
      const userPermissions = 
        Array.isArray(data?.userPermissions) ? data.userPermissions :
        Array.isArray(data?.user_permissions) ? data.user_permissions :
        Array.isArray(data?.permissions) ? data.permissions :
        [];

      // Filter out blocked menus
      const actualAccessibleMenus = getActualAccessibleMenus(
        rawAccessibleMenus, 
        rawBlockedMenus
      );

      const result = {
        accessibleMenus: actualAccessibleMenus,
        userPermissions: userPermissions,
        blockedMenus: rawBlockedMenus.map((bm: any) => 
          typeof bm === 'string' ? bm : bm.menu_key
        ),
      };

      console.log('✅ API: My accessible menus processed:', {
        accessible: result.accessibleMenus.length,
        permissions: result.userPermissions.length,
        blocked: result.blockedMenus.length,
        rawData: data,
      });

      return result;
    } catch (error: any) {
      console.error('❌ API error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // If not authenticated, return empty but don't fail
      if (error.response?.status === 401 || error.message?.includes('401')) {
        console.log('⚠️ Not authenticated, returning empty permissions');
        return rejectWithValue('Not authenticated');
      }
      
      // For other errors, still reject but with details
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch accessible menus'
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
    params: { page?: number; limit?: number; menuKey?: string; name?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      console.log('🔄 API: Fetching menu permissions list...', params);
      
      const response = await RbacService.listMenuPermissions(params);
      const data = extractResponseData(response);
      
      const menuPermissions = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.menuPermissions)
          ? data.menuPermissions
          : Array.isArray(data?.data) 
            ? data.data 
            : [];
          
      const pagination = data?.pagination || null;

      console.log('✅ API: Menu permissions list fetched:', {
        count: menuPermissions.length,
      });

      return { menuPermissions, pagination };
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch menu permissions'
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
      console.log('🔄 API: Fetching permissions for menu:', menuKey);
      
      const response = await RbacService.getMenuPermissions(menuKey);
      const data = extractResponseData(response);

      console.log('✅ API: Menu permissions fetched for:', menuKey);

      return data;
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch menu permissions'
      );
    }
  }
);

/**
 * Fetch all permissions
 */
export const fetchAllPermissions = createAsyncThunk(
  'menuPermissions/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 API: Fetching all permissions...');
      
      const response = await RbacService.listPermissions({
        page: 1,
        limit: 1000,
      });
      
      const data = extractResponseData(response);
      
      const permissions = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.permissions)
          ? data.permissions
          : Array.isArray(data?.data) 
            ? data.data 
            : [];

      console.log('✅ API: All permissions fetched:', permissions.length);

      return permissions;
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch permissions'
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
      console.log('🔄 API: Linking menu permission...', payload);
      
      const response = await RbacService.linkMenuPermission(payload);
      const data = extractResponseData(response);

      console.log('✅ API: Menu permission linked');

      return data;
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to link permission'
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
      console.log('🔄 API: Bulk linking menu permissions...', payload);
      
      const response = await RbacService.bulkLinkMenuPermissions(payload);

      console.log('✅ API: Menu permissions bulk linked');

      return response;
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to bulk link permissions'
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
      console.log('🔄 API: Unlinking menu permission...', payload);
      
      const response = await RbacService.unlinkMenuPermission(payload);

      console.log('✅ API: Menu permission unlinked');

      return { menuKey: payload.menuKey, permissionId: payload.permissionId };
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to unlink permission'
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
      console.log('🔄 API: Checking menu access for:', menuKey);
      
      const response = await RbacService.checkMenuAccess(menuKey);
      
      const hasAccess = response?.hasAccess ?? false;

      console.log('✅ API: Menu access checked:', hasAccess);

      return { menuKey, hasAccess };
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to check menu access'
      );
    }
  }
);

/**
 * Get user accessible menus (for specific user - admin use)
 */
export const fetchUserAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchUserAccessibleMenus',
  async (userId?: number, { rejectWithValue }) => {
    try {
      console.log('🔄 API: Fetching accessible menus for user:', userId);
      
      const response = await RbacService.getUserAccessibleMenus(userId);
      const data = extractResponseData(response);

      console.log('✅ API: User accessible menus fetched');

      return data;
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch user accessible menus'
      );
    }
  }
);

/**
 * Get blocked menus for current user
 */
export const fetchBlockedMenus = createAsyncThunk(
  'menuPermissions/fetchBlockedMenus',
  async (userId?: number, { rejectWithValue }) => {
    try {
      console.log('🔄 API: Fetching blocked menus...');
      
      const response = await RbacService.getBlockedMenus({ userId });
      const data = extractResponseData(response);
      
      const blockedMenus = Array.isArray(data) ? data : [];

      console.log('✅ API: Blocked menus fetched');

      return blockedMenus;
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch blocked menus'
      );
    }
  }
);

/**
 * Get menu hierarchy with access info
 */
export const fetchMenuHierarchyWithAccess = createAsyncThunk(
  'menuPermissions/fetchMenuHierarchyWithAccess',
  async (
    params: { userId?: number; includeBlockedReasons?: boolean } = {},
    { rejectWithValue }
  ) => {
    try {
      console.log('🔄 API: Fetching menu hierarchy with access...');
      
      const response = await RbacService.getMenuHierarchyWithAccess(params);
      const data = extractResponseData(response);

      console.log('✅ API: Menu hierarchy fetched');

      return data;
    } catch (error: any) {
      console.error('❌ API error:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch menu hierarchy'
      );
    }
  }
);

// ==================== SLICE ====================
const menuPermissionsSlice = createSlice({
  name: 'menuPermissions',
  initialState,
  reducers: {
    setMenuAccess: (state, action: PayloadAction<{
      accessibleMenus: string[];
      userPermissions: UserPermission[];
      blockedMenus?: string[];
    }>) => {
      let finalAccessibleMenus = action.payload.accessibleMenus;
      
      if (action.payload.blockedMenus?.length) {
        const blockedSet = new Set(action.payload.blockedMenus);
        finalAccessibleMenus = action.payload.accessibleMenus.filter(
          menu => !blockedSet.has(menu)
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

    removeMenuPermission: (state, action: PayloadAction<{ menuKey: string; permissionId: number }>) => {
      state.menuPermissions = state.menuPermissions.filter(
        mp => !(mp.menu_key === action.payload.menuKey && mp.permission_id === action.payload.permissionId)
      );
    },

    updateMenuPermission: (state, action: PayloadAction<MenuPermission>) => {
      const index = state.menuPermissions.findIndex(
        mp => mp.menu_key === action.payload.menu_key && mp.permission_id === action.payload.permission_id
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
        console.log('⏳ Redux: Fetching my accessible menus...');
      })
      .addCase(fetchMyAccessibleMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.accessibleMenus = action.payload.accessibleMenus;
        state.userPermissions = action.payload.userPermissions;
        state.blockedMenus = action.payload.blockedMenus;
        state.initialized = true;
        state.error = null;
        
        console.log('✅ Redux: My accessible menus stored:', {
          accessible: state.accessibleMenus.length,
          permissions: state.userPermissions.length,
          blocked: state.blockedMenus.length,
        });
      })
      .addCase(fetchMyAccessibleMenus.rejected, (state, action) => {
        state.loading = false;
        const errorMessage = action.payload as string;
        
        // Always set initialized to true, even on error
        // This allows the app to continue (user might be super admin)
        state.initialized = true;
        
        // Only set error if it's not an auth error
        if (errorMessage !== 'Not authenticated') {
          state.error = errorMessage;
        }
        
        console.log('❌ Redux: My accessible menus rejected:', errorMessage);
      })

      // ==================== Other reducers ====================
      .addCase(fetchMenuPermissions.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuPermissions.fulfilled, (state, action) => {
        state.crudLoading = false;
        state.menuPermissions = action.payload.menuPermissions as any;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchMenuPermissions.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })
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
      .addCase(fetchAllPermissions.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        state.crudLoading = false;
        state.allPermissions = action.payload as any;
        state.error = null;
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })
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
      .addCase(unlinkMenuPermission.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(unlinkMenuPermission.fulfilled, (state, action) => {
        state.crudLoading = false;
        state.error = null;
        state.menuPermissions = state.menuPermissions.filter(
          mp => !(mp.menu_key === action.payload.menuKey && mp.permission_id === action.payload.permissionId)
        );
      })
      .addCase(unlinkMenuPermission.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })
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
      })
      .addCase(fetchUserAccessibleMenus.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAccessibleMenus.fulfilled, (state) => {
        state.crudLoading = false;
        state.error = null;
      })
      .addCase(fetchUserAccessibleMenus.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBlockedMenus.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchBlockedMenus.fulfilled, (state, action) => {
        state.crudLoading = false;
        state.blockedMenus = action.payload as string[];
        state.error = null;
      })
      .addCase(fetchBlockedMenus.rejected, (state, action) => {
        state.crudLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMenuHierarchyWithAccess.pending, (state) => {
        state.crudLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuHierarchyWithAccess.fulfilled, (state) => {
        state.crudLoading = false;
        state.error = null;
      })
      .addCase(fetchMenuHierarchyWithAccess.rejected, (state, action) => {
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

// Selectors
export const selectAccessibleMenus = (state: RootState) => state.menuPermissions.accessibleMenus;
export const selectUserPermissions = (state: RootState) => state.menuPermissions.userPermissions;
export const selectBlockedMenus = (state: RootState) => state.menuPermissions.blockedMenus;
export const selectMenuPermissionsInitialized = (state: RootState) => state.menuPermissions.initialized;
export const selectMenuPermissions = (state: RootState) => state.menuPermissions.menuPermissions;
export const selectAllPermissions = (state: RootState) => state.menuPermissions.allPermissions;
export const selectMenuPermissionsLoading = (state: RootState) => state.menuPermissions.crudLoading;
export const selectMenuPermissionsPagination = (state: RootState) => state.menuPermissions.pagination;
export const selectMenuPermissionsError = (state: RootState) => state.menuPermissions.error;
export const selectMenuPermissionsLoadingAny = (state: RootState) => 
  state.menuPermissions.loading || state.menuPermissions.crudLoading;

// Helper selectors
export const selectCanAccessMenu = (menuKey: string) => (state: RootState) => {
  return state.menuPermissions.accessibleMenus.includes(menuKey);
};

export const selectHasPermission = (permissionKey: string) => (state: RootState) => {
  return state.menuPermissions.userPermissions.some(
    perm => perm.permission_key === permissionKey
  );
};

export default menuPermissionsSlice.reducer;