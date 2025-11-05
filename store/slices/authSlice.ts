// store/slices/authSlice.ts - UPDATED
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService, type RegisterPayload, type LoginPayload, } from '@/lib/api';
import Cookies from 'js-cookie';
import { CreateAgencyPayload, CreateBrandPayload, CreateCreatorPayload } from '@/lib/api/services/auth-service';

// ✅ UPDATED: Changed organizationId to tenantId
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId?: string; // ✅ Changed from organizationId
  userType?: string;
  onboardingRequired?: boolean;
  roles?: string[];
  permissions?: string[];
  tenants?: Array<{ // ✅ NEW: User can belong to multiple tenants
    id: string;
    name: string;
    type: string;
  }>;
  isSuperAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresVerification: boolean;
  verificationEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresVerification: false,
  verificationEmail: null,
};

// ============================================
// HELPER: Store User & Tokens
// ============================================
const storeAuthData = (user: User, accessToken: string, refreshToken: string) => {
  Cookies.set('accessToken', accessToken, { expires: 7, path: '/', secure: true, sameSite: 'strict' });
  Cookies.set('refreshToken', refreshToken, { expires: 7, path: '/', secure: true, sameSite: 'strict' });
  Cookies.set('user', JSON.stringify(user), { expires: 7, path: '/', secure: true, sameSite: 'strict' });
};

// ============================================
// ASYNC THUNKS
// ============================================

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyRegistration = createAsyncThunk(
  'auth/verifyRegistration',
  async (payload: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await AuthService.verifyRegistration(payload);
      const { user, accessToken, refreshToken } = response.data;

      storeAuthData(user, accessToken, refreshToken);

      return { user, accessToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await AuthService.resendVerification(email);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(payload);
      const { user, accessToken, refreshToken } = response.data;

      storeAuthData(user, accessToken, refreshToken);

      return { user, accessToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAgency = createAsyncThunk(
  'auth/createAgency',
  async (payload: CreateAgencyPayload, { rejectWithValue }) => {
    try {
      const response = await AuthService.createAgency(payload);
      const { user, accessToken, refreshToken, tenantId } = response.data;

      storeAuthData(user, accessToken, refreshToken);

      return { user, accessToken, tenantId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createBrand = createAsyncThunk(
  'auth/createBrand',
  async (payload: CreateBrandPayload, { rejectWithValue }) => {
    try {
      const response = await AuthService.createBrand(payload);
      const { user, accessToken, refreshToken, tenantId } = response.data;

      storeAuthData(user, accessToken, refreshToken);

      return { user, accessToken, tenantId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCreator = createAsyncThunk(
  'auth/createCreator',
  async (payload: CreateCreatorPayload, { rejectWithValue }) => {
    try {
      const response = await AuthService.createCreator(payload);
      const { user, accessToken, refreshToken, tenantId } = response.data;

      storeAuthData(user, accessToken, refreshToken);

      return { user, accessToken, tenantId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('refreshToken', { path: '/' });
      Cookies.remove('user', { path: '/' });
      return null;
    } catch (error: any) {
      // Even if API call fails, clear cookies
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('refreshToken', { path: '/' });
      Cookies.remove('user', { path: '/' });
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await AuthService.forgotPassword({ email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await AuthService.resetPassword(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.getCurrentUser();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const loadUserFromCookies = createAsyncThunk(
  'auth/loadUserFromCookies',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = Cookies.get('accessToken');
      const userCookie = Cookies.get('user');

      if (accessToken && userCookie) {
        const user = JSON.parse(userCookie);
        return { user, accessToken };
      }

      return rejectWithValue('No user found');
    } catch (error) {
      return rejectWithValue('Failed to load user');
    }
  }
);

// ============================================
// SLICE
// ============================================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVerification: (state) => {
      state.requiresVerification = false;
      state.verificationEmail = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.accessToken = Cookies.get('accessToken') || null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        Cookies.set('user', JSON.stringify(state.user), { expires: 7, path: '/', secure: true, sameSite: 'strict' });
      }
    },
    resetAuthState: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.requiresVerification = false;
      state.verificationEmail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requiresVerification = action.payload.requiresVerification;
        state.verificationEmail = action.payload.email;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Verify Registration
      .addCase(verifyRegistration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyRegistration.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.requiresVerification = false;
        state.verificationEmail = null;
      })
      .addCase(verifyRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        if ((action.payload as string).includes('not verified')) {
          state.requiresVerification = true;
        }
      })

      // Create Agency
      .addCase(createAgency.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAgency.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = { ...action.payload.user, onboardingRequired: false };
        state.accessToken = action.payload.accessToken;
      })
      .addCase(createAgency.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Brand
      .addCase(createBrand.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = { ...action.payload.user, onboardingRequired: false };
        state.accessToken = action.payload.accessToken;
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Creator
      .addCase(createCreator.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCreator.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = { ...action.payload.user, onboardingRequired: false };
        state.accessToken = action.payload.accessToken;
      })
      .addCase(createCreator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        // Clear state even on error
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Load User from Cookies
      .addCase(loadUserFromCookies.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      });
  },
});

export const {
  clearError,
  clearVerification,
  setUser,
  updateUser,
  resetAuthState
} = authSlice.actions;

export default authSlice.reducer;