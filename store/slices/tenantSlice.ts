// store/slices/tenantSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TenantService, type Tenant, type TenantMember, type TenantUsage, type UpdateTenantPayload } from '@/lib/api/services/tenant-service';
import type { RootState } from '@/store/store';

interface TenantState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  members: TenantMember[];
  usage: TenantUsage | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: TenantState = {
  tenants: [],
  currentTenant: null,
  members: [],
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
 * Fetch tenant members
 */
export const fetchTenantMembers = createAsyncThunk(
  'tenant/fetchTenantMembers',
  async (tenantId: number, { rejectWithValue }) => {
    try {
      const response = await TenantService.getTenantMembers(tenantId);
      return response.data;
    } catch (error: any) {
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
      state.usage = null;
    },
    
    resetTenantState: (state) => {
      state.tenants = [];
      state.currentTenant = null;
      state.members = [];
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
      })
      .addCase(fetchTenantMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = action.payload;
      })
      .addCase(fetchTenantMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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