// store/slices/subscriptionSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { SubscriptionService } from "@/lib/api/services/subscription.service";
import type { RootState } from "@/store/store";

interface Plan {
  id: number;
  planName: string;
  planSlug: string;
  planType: string;
  planTier: string;
  isFree: boolean;
  priceMonthly?: number;
  priceYearly?: number;
  features?: any;
  maxStaff?: number;
  maxStorageGb?: number;
  maxCampaigns?: number;
}

interface Subscription {
  id: number;
  planId: number;
  status: string;
  billingCycle: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  plan?: Plan;
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

// Thunks
export const fetchPlans = createAsyncThunk(
  "subscription/fetchPlans",
  async (query: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.listPlans(query);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to fetch plans";

      return rejectWithValue(message);
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

export const checkLimit = createAsyncThunk(
  "subscription/checkLimit",
  async (limitType: string, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.checkLimit(limitType);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const checkFeature = createAsyncThunk(
  "subscription/checkFeature",
  async (featureName: string, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.checkFeature(featureName);
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
        state.plans = action.payload.data || action.payload;
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
      .addCase(changeSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload.data || action.payload;
      })
      .addCase(changeSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload.data || action.payload;
      })
      .addCase(reactivateSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload.data || action.payload;
      })
      .addCase(fetchSubscriptionHistory.fulfilled, (state, action) => {
        state.subscriptionHistory = action.payload.data || action.payload;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.subscriptionStatus = action.payload.data || action.payload;
      });
  }
});

export const { clearError, resetSubscriptionState } = subscriptionSlice.actions;

export const selectPlans = (state: RootState) => state.subscription.plans;
export const selectCurrentSubscription = (state: RootState) =>
  state.subscription.currentSubscription;
export const selectSubscriptionHistory = (state: RootState) =>
  state.subscription.subscriptionHistory;
export const selectSubscriptionStatus = (state: RootState) => state.subscription.subscriptionStatus;
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading;
export const selectSubscriptionError = (state: RootState) => state.subscription.error;

export default subscriptionSlice.reducer;
