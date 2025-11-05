
// store/slices/menu-permissions.slice.ts - FIXED FOR BACKEND RESPONSE
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RbacService } from '@/lib/api/services/rbac-service';

interface MenuPermissionsState {
  userPermissions: string[];
  accessibleMenus: string[];
  blockedMenus: string[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: MenuPermissionsState = {
  userPermissions: [],
  accessibleMenus: [],
  blockedMenus: [],
  loading: false,
  error: null,
  initialized: false,
};

export const fetchMyAccessibleMenus = createAsyncThunk(
  'menuPermissions/fetchMyAccessibleMenus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await RbacService.getMyAccessibleMenus();
      console.log("✅ Raw API response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to load menu permissions:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu permissions');
    }
  }
);

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

const menuPermissionsSlice = createSlice({
  name: 'menuPermissions',
  initialState,
  reducers: {
    clearMenuPermissions: (state) => {
      state.userPermissions = [];
      state.accessibleMenus = [];
      state.blockedMenus = [];
      state.initialized = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAccessibleMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAccessibleMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        
        // Extract permission names
        state.userPermissions = (action.payload.userPermissions || []).map(
          (p: any) => p.name as string
        );
        
        // CRITICAL FIX: Backend returns array of objects with menu_key property
        // Convert to flat string array
        const accessibleMenusRaw = action.payload.accessibleMenus || [];
        state.accessibleMenus = Array.isArray(accessibleMenusRaw)
          ? accessibleMenusRaw.map((item: any) => 
              typeof item === 'string' ? item : item.menu_key
            ).filter(Boolean)
          : [];
        
        const blockedMenusRaw = action.payload.blockedMenus || [];
        state.blockedMenus = Array.isArray(blockedMenusRaw)
          ? blockedMenusRaw.map((item: any) => 
              typeof item === 'string' ? item : item.menu_key
            ).filter(Boolean)
          : [];

        console.log("📋 Permissions state updated:", {
          permissions: state.userPermissions.length,
          accessible: state.accessibleMenus,
          blocked: state.blockedMenus
        });
      })
      .addCase(fetchMyAccessibleMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initialized = true;
        console.error("❌ Menu permissions error:", action.payload);
      })
      .addCase(fetchUserAccessibleMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAccessibleMenus.fulfilled, (state, action) => {
        state.loading = false;
        
        state.userPermissions = (action.payload.userPermissions || []).map(
          (p: any) => p.name as string
        );
        
        const accessibleMenusRaw = action.payload.accessibleMenus || [];
        state.accessibleMenus = Array.isArray(accessibleMenusRaw)
          ? accessibleMenusRaw.map((item: any) => 
              typeof item === 'string' ? item : item.menu_key
            ).filter(Boolean)
          : [];
        
        const blockedMenusRaw = action.payload.blockedMenus || [];
        state.blockedMenus = Array.isArray(blockedMenusRaw)
          ? blockedMenusRaw.map((item: any) => 
              typeof item === 'string' ? item : item.menu_key
            ).filter(Boolean)
          : [];
      })
      .addCase(fetchUserAccessibleMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMenuPermissions, setError } = menuPermissionsSlice.actions;
export default menuPermissionsSlice.reducer;

// Selectors
export const selectUserPermissions = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.userPermissions;

export const selectAccessibleMenus = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.accessibleMenus;

export const selectBlockedMenus = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.blockedMenus;

export const selectMenuPermissionsLoading = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.loading;

export const selectMenuPermissionsInitialized = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.initialized;

export const selectMenuPermissionsError = (state: { menuPermissions: MenuPermissionsState }) => 
  state.menuPermissions.error;