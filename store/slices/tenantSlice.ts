// ============================================
// store/slices/tenantSlice.ts - Enhanced
// ============================================
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  TenantService, 
  type Tenant, 
  type TenantMember, 
  type TenantUsage, 
  type UpdateTenantPayload,
  type GetMembersParams,
  type PaginatedMembersResponse 
} from '@/lib/api/services/tenant-service';
import type { RootState } from '@/store/store';

interface TenantState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  members: TenantMember[];
  membersPagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  } | null;
  usage: TenantUsage | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: TenantState = {
  tenants: [],
  currentTenant: null,
  members: [],
  membersPagination: null,
  usage: null,
  isLoading: false,
  error: null,
  initialized: false,
};

// ==================== ASYNC THUNKS ====================

/**
 * Fetch all tenants for the current user
 */
export const fetchMyTenants = createAsyncThunk(
  'tenant/fetchMyTenants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await TenantService.getMyTenants();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Fetch tenant by ID
 */
export const fetchTenantById = createAsyncThunk(
  'tenant/fetchTenantById',
  async (tenantId: number, { rejectWithValue }) => {
    try {
      const response = await TenantService.getTenantById(tenantId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Update tenant
 */
export const updateTenant = createAsyncThunk(
  'tenant/updateTenant',
  async ({ tenantId, payload }: { tenantId: number; payload: UpdateTenantPayload }, { rejectWithValue }) => {
    try {
      const response = await TenantService.updateTenant(tenantId, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Fetch tenant members with pagination, sorting, and search
 */
export const fetchTenantMembers = createAsyncThunk(
  'tenant/fetchTenantMembers',
  async ({ tenantId, params }: { tenantId: number; params?: GetMembersParams }, { rejectWithValue }) => {
    try {
      console.log('🔵 Fetching tenant members:', { tenantId, params });
      const response = await TenantService.getTenantMembers(tenantId, params);
      console.log('🟢 Full API Response:', response);
      console.log('🟢 Response.data:', response.data);
      
      // The response structure is: { data: { data: [], pagination: {} } }
      // We need to return response.data which contains { data: [], pagination: {} }
      return response.data;
    } catch (error: any) {
      console.error('🔴 Fetch error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Fetch tenant usage statistics
 */
export const fetchTenantUsage = createAsyncThunk(
  'tenant/fetchTenantUsage',
  async (tenantId: number, { rejectWithValue }) => {
    try {
      const response = await TenantService.getTenantUsage(tenantId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Rotate tenant encryption keys
 */
export const rotateTenantKeys = createAsyncThunk(
  'tenant/rotateTenantKeys',
  async (tenantId: number, { rejectWithValue }) => {
    try {
      const response = await TenantService.rotateTenantKeys(tenantId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ==================== SLICE ====================

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    setCurrentTenant: (state, action: PayloadAction<Tenant>) => {
      state.currentTenant = action.payload;
    },
    
    clearCurrentTenant: (state) => {
      state.currentTenant = null;
      state.members = [];
      state.membersPagination = null;
      state.usage = null;
    },
    
    resetTenantState: (state) => {
      state.tenants = [];
      state.currentTenant = null;
      state.members = [];
      state.membersPagination = null;
      state.usage = null;
      state.error = null;
      state.initialized = false;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch My Tenants
      .addCase(fetchMyTenants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTenants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants = action.payload;
        state.initialized = true;
      })
      .addCase(fetchMyTenants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true;
      })
      
      // Fetch Tenant By ID
      .addCase(fetchTenantById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenantById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTenant = action.payload;
        
        // Also update in tenants array if exists
        const index = state.tenants.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
      })
      .addCase(fetchTenantById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update Tenant
      .addCase(updateTenant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTenant = action.payload;
        
        // Update in tenants array
        const index = state.tenants.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
      })
      .addCase(updateTenant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Tenant Members
      .addCase(fetchTenantMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log('⏳ Fetching members - pending');
      })
      .addCase(fetchTenantMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('✅ Fetch members fulfilled - RAW PAYLOAD:', action.payload);
        console.log('✅ Payload type:', typeof action.payload);
        console.log('✅ Payload keys:', action.payload ? Object.keys(action.payload) : 'null');
        
        // Handle response structure
        if (action.payload) {
          // Check if payload has data and pagination properties
          if ('data' in action.payload && 'pagination' in action.payload) {
            state.members = action.payload.data || [];
            state.membersPagination = action.payload.pagination || null;
            console.log('✅ Structure 1: Direct data/pagination');
          } 
          // Check if it's an array (old format)
          else if (Array.isArray(action.payload)) {
            state.members = action.payload;
            state.membersPagination = null;
            console.log('✅ Structure 2: Direct array (legacy)');
          }
          // Unknown structure
          else {
            console.warn('⚠️ Unknown payload structure:', action.payload);
            state.members = [];
            state.membersPagination = null;
          }
        } else {
          console.warn('⚠️ Empty payload received');
          state.members = [];
          state.membersPagination = null;
        }
        
        console.log('📦 Final Updated State:', {
          membersCount: state.members.length,
          members: state.members,
          pagination: state.membersPagination
        });
      })
      .addCase(fetchTenantMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.members = [];
        state.membersPagination = null;
        console.error('❌ Fetch members rejected:', action.payload);
      })
      
      // Fetch Tenant Usage
      .addCase(fetchTenantUsage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenantUsage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.usage = action.payload;
      })
      .addCase(fetchTenantUsage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Rotate Tenant Keys
      .addCase(rotateTenantKeys.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rotateTenantKeys.fulfilled, (state) => {
        state.isLoading = false;
        // Key rotation doesn't change tenant data, just success state
      })
      .addCase(rotateTenantKeys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ==================== ACTIONS ====================

export const {
  clearError,
  setCurrentTenant,
  clearCurrentTenant,
  resetTenantState,
} = tenantSlice.actions;

// ==================== SELECTORS ====================

export const selectTenants = (state: RootState) => state.tenant.tenants;
export const selectCurrentTenant = (state: RootState) => state.tenant.currentTenant;
export const selectTenantMembers = (state: RootState) => state.tenant.members;
export const selectMembersPagination = (state: RootState) => state.tenant.membersPagination;
export const selectTenantUsage = (state: RootState) => state.tenant.usage;
export const selectTenantLoading = (state: RootState) => state.tenant.isLoading;
export const selectTenantError = (state: RootState) => state.tenant.error;
export const selectTenantInitialized = (state: RootState) => state.tenant.initialized;

/**
 * Get tenant by ID from the store
 */
export const selectTenantById = (tenantId: number) => (state: RootState) =>
  state.tenant.tenants.find(t => t.id === tenantId);

/**
 * Check if usage is approaching limits (>80%)
 */
export const selectUsageWarnings = (state: RootState) => {
  const usage = state.tenant.usage;
  if (!usage) return [];
  
  const warnings: string[] = [];
  
  if (usage.usage.staffPercent > 80) {
    warnings.push('staff');
  }
  if (usage.usage.storagePercent > 80) {
    warnings.push('storage');
  }
  if (usage.usage.campaignsPercent > 80) {
    warnings.push('campaigns');
  }
  
  return warnings;
};

export default tenantSlice.reducer;