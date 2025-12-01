// store/slices/subscriptionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { SubscriptionService } from "@/lib/api/services/subscription.service";
import type { RootState } from "@/store/store";

interface Plan {
  id: number;
  plan_name: string;
  plan_slug: string;
  plan_type: string;
  plan_tier: string;
  is_free: boolean;
  price_monthly?: number;
  price_yearly?: number;
  features?: any;
  max_staff?: number;
  max_storage_gb?: number;
  max_campaigns?: number;
  max_invitations?: number;
  max_integrations?: number;
  priority_support?: boolean;
  custom_branding?: boolean;
  white_label?: boolean;
  sso_enabled?: boolean;
}

interface Subscription {
  subscription_plan_id: number;
  subscription_status: string;
  billing_cycle: string;
  subscription_started_at?: string;
  next_billing_date?: string;
  plan_name?: string;
  plan_tier?: string;
}

interface SubscriptionState {
  plans: Plan[];
  currentSubscription: Subscription | null;
  subscriptionHistory: any[];
  subscriptionStatus: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  plans: [],
  currentSubscription: null,
  subscriptionHistory: [],
  subscriptionStatus: null,
  isLoading: false,
  error: null
};

export const fetchPlans = createAsyncThunk(
  "subscription/fetchPlans",
  async (query: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.listPlans(query);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch plans");
    }
  }
);

export const fetchMySubscription = createAsyncThunk(
  "subscription/fetchMySubscription",
  async (_, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.getMySubscription();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const changeSubscription = createAsyncThunk(
  "subscription/change",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.changeSubscription(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  "subscription/cancel",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.cancelSubscription(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const reactivateSubscription = createAsyncThunk(
  "subscription/reactivate",
  async (_, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.reactivateSubscription();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSubscriptionHistory = createAsyncThunk(
  "subscription/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.getSubscriptionHistory();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.getSubscriptionStatus();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetSubscriptionState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload.data || action.payload || [];
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMySubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMySubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload.data || action.payload;
      })
      .addCase(fetchMySubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(changeSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeSubscription.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changeSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(reactivateSubscription.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchSubscriptionHistory.fulfilled, (state, action) => {
        state.subscriptionHistory = action.payload.data || action.payload || [];
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.subscriptionStatus = action.payload.data || action.payload;
      });
  }
});

export const { clearError, resetSubscriptionState } = subscriptionSlice.actions;

export const selectPlans = (state: RootState) => state.subscription.plans;
export const selectCurrentSubscription = (state: RootState) => state.subscription.currentSubscription;
export const selectSubscriptionHistory = (state: RootState) => state.subscription.subscriptionHistory;
export const selectSubscriptionStatus = (state: RootState) => state.subscription.subscriptionStatus;
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading;
export const selectSubscriptionError = (state: RootState) => state.subscription.error;

export default subscriptionSlice.reducer;