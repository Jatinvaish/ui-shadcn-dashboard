// ============================================
// store/slices/tenantSlice.ts - Fixed TypeScript errors
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
export const fetchMyTenants = createAsyncThunk<
  Tenant[],
  void,
  { rejectValue: string }
>(
  'tenant/fetchMyTenants',
  async (_, { rejectWithValue }) => {
    try {
      const response:any = await TenantService.getMyTenants();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Fetch tenant by ID
 */
export const fetchTenantById = createAsyncThunk<
  Tenant,
  number,
  { rejectValue: string }
>(
  'tenant/fetchTenantById',
  async (tenantId, { rejectWithValue }) => {
    try {
      const response:any = await TenantService.getTenantById(tenantId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Update tenant
 */
export const updateTenant = createAsyncThunk<
  Tenant,
  { tenantId: number; payload: UpdateTenantPayload },
  { rejectValue: string }
>(
  'tenant/updateTenant',
  async ({ tenantId, payload }, { rejectWithValue }) => {
    try {
      const response:any = await TenantService.updateTenant(tenantId, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Fetch tenant members with pagination, sorting, and search
 */
export const fetchTenantMembers = createAsyncThunk<
  PaginatedMembersResponse | TenantMember[],
  { tenantId: number; params?: GetMembersParams },
  { rejectValue: string }
>(
  'tenant/fetchTenantMembers',
  async ({ tenantId, params }, { rejectWithValue }) => {
    try {
      console.log('🔵 Fetching tenant members:', { tenantId, params });
      const response:any = await TenantService.getTenantMembers(tenantId, params);
      console.log('🟢 Full API Response:', response);
      console.log('🟢 Response.data:', response.data);
      
      // The response structure can be either:
      // 1. { data: { data: [], pagination: {} } } - nested structure
      // 2. { data: [] } - simple array
      // We return response.data as-is and handle both cases in the reducer
      return response.data as PaginatedMembersResponse | TenantMember[];
    } catch (error: any) {
      console.error('🔴 Fetch error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Fetch tenant usage statistics
 */
export const fetchTenantUsage = createAsyncThunk<
  TenantUsage,
  number,
  { rejectValue: string }
>(
  'tenant/fetchTenantUsage',
  async (tenantId, { rejectWithValue }) => {
    try {
      const response:any = await TenantService.getTenantUsage(tenantId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/**
 * Rotate tenant encryption keys
 */
export const rotateTenantKeys = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>(
  'tenant/rotateTenantKeys',
  async (tenantId, { rejectWithValue }) => {
    try {
      const response:any = await TenantService.rotateTenantKeys(tenantId);
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
        state.error = action.payload ?? 'Failed to fetch tenants';
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
        state.error = action.payload ?? 'Failed to fetch tenant';
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
        state.error = action.payload ?? 'Failed to update tenant';
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
        
        // Handle response structure - can be PaginatedMembersResponse or TenantMember[]
        if (action.payload) {
          // Check if payload has data and pagination properties (PaginatedMembersResponse)
          if (typeof action.payload === 'object' && 'data' in action.payload && 'pagination' in action.payload) {
            state.members = action.payload.data;
            state.membersPagination = action.payload.pagination;
            console.log('✅ Paginated structure:', {
              membersCount: state.members.length,
              pagination: state.membersPagination
            });
          } 
          // Check if it's a direct array (legacy format)
          else if (Array.isArray(action.payload)) {
            state.members = action.payload;
            state.membersPagination = null;
            console.log('✅ Array structure (legacy):', {
              membersCount: state.members.length
            });
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
        state.error = action.payload ?? 'Failed to fetch members';
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
        state.error = action.payload ?? 'Failed to fetch usage';
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
        state.error = action.payload ?? 'Failed to rotate keys';
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