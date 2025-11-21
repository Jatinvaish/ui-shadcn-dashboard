// store/slices/authSlice.ts - FIXED WITH INITIALIZATION
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthService, type RegisterPayload, type LoginPayload, RbacService } from "@/lib/api";
import Cookies from "js-cookie";
import {
  CreateAgencyPayload,
  CreateBrandPayload,
  CreateCreatorPayload
} from "@/lib/api/services/auth-service";
import type { RootState } from "@/store/store";
import { setMenuAccess } from "./menu-permissions.slice";

// User interface
interface User {
  id: any;
  email: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
  userType?: string;
  user_type?: string;
  onboardingRequired?: boolean;
  roles?: string[];
  permissions?: string[];
  tenants?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  isSuperAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresVerification: boolean;
  verificationEmail: string | null;
  initialized: boolean; // ✅ Track initialization
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresVerification: false,
  verificationEmail: null,
  initialized: false,
  refreshToken: null,
  loading: false
};

// Helper: Store User & Tokens
const storeAuthData = (user: User, accessToken: string, refreshToken: string) => {
  Cookies.set("accessToken", accessToken, {
    expires: 7,
    path: "/",
    secure: true,
    sameSite: "strict"
  });
  Cookies.set("refreshToken", refreshToken, {
    expires: 7,
    path: "/",
    secure: true,
    sameSite: "strict"
  });
  Cookies.set("user", JSON.stringify(user), {
    expires: 7,
    path: "/",
    secure: true,
    sameSite: "strict"
  });
};

function normalizeUserData(userData: any) {
  if (!userData) return null;

  return {
    ...userData,
    // ✅ Map user_type from DB to userType for consistency
    userType: userData.userType || userData.user_type || "pending",
    // Keep original for compatibility
    user_type: userData.user_type || userData.userType || "pending"
  };
}

// Async Thunks
export const register = createAsyncThunk(
  "auth/register",
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
  "auth/verifyRegistration",
  async (payload: { email: string; code: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await AuthService.verifyRegistration(payload);
      const { user, accessToken, refreshToken } = response.data;
      storeAuthData(user, accessToken, refreshToken);

      // ✅ Load menu permissions after verification
      try {
        const permResponse: any = await RbacService.getMyAccessibleMenus();
        if (permResponse.data?.success && permResponse.data?.data) {
          dispatch(
            setMenuAccess({
              accessibleMenus: permResponse.data.accessibleMenus || [],
              userPermissions: permResponse.data.userPermissions || []
            })
          );
        }
      } catch (permError) {
        console.error("Failed to load permissions after verification:", permError);
        const userType = user?.userType || user?.user_type || "";
        if (userType === "super_admin" || userType === "saas_admin") {
          dispatch(
            setMenuAccess({
              accessibleMenus: [],
              userPermissions: []
            })
          );
        }
      }

      return { user, accessToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
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
  "auth/login",
  async (payload: LoginPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await AuthService.login(payload);
      const { user, accessToken, refreshToken } = response.data;
      storeAuthData(user, accessToken, refreshToken);

      // ✅ Load menu permissions after login
      try {
        const permResponse: any = await RbacService.getMyAccessibleMenus();
        if (permResponse.data?.success && permResponse.data?.data) {
          dispatch(
            setMenuAccess({
              accessibleMenus: permResponse.data.accessibleMenus || [],
              userPermissions: permResponse.data.userPermissions || []
            })
          );
        }
      } catch (permError) {
        console.error("Failed to load permissions after login:", permError);
        const userType = user?.userType || user?.user_type || "";
        if (userType === "super_admin" || userType === "saas_admin") {
          dispatch(
            setMenuAccess({
              accessibleMenus: [],
              userPermissions: []
            })
          );
        }
      }

      return { user, accessToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAgency = createAsyncThunk(
  "auth/createAgency",
  async (payload: CreateAgencyPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await AuthService.createAgency(payload);
      const { user, accessToken, refreshToken, tenantId } = response.data;
      storeAuthData(user, accessToken, refreshToken);

      // ✅ Load menu permissions
      try {
        const permResponse: any = await RbacService.getMyAccessibleMenus();
        if (permResponse.data?.success && permResponse.data?.data) {
          dispatch(
            setMenuAccess({
              accessibleMenus: permResponse.data.accessibleMenus || [],
              userPermissions: permResponse.data.userPermissions || []
            })
          );
        }
      } catch (permError) {
        console.error("Failed to load permissions:", permError);
      }

      return { user, accessToken, tenantId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createBrand = createAsyncThunk(
  "auth/createBrand",
  async (payload: CreateBrandPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await AuthService.createBrand(payload);
      const { user, accessToken, refreshToken, tenantId } = response.data;
      storeAuthData(user, accessToken, refreshToken);

      // ✅ Load menu permissions
      try {
        const permResponse: any = await RbacService.getMyAccessibleMenus();
        if (permResponse.data?.success && permResponse.data?.data) {
          dispatch(
            setMenuAccess({
              accessibleMenus: permResponse.data.accessibleMenus || [],
              userPermissions: permResponse.data.userPermissions || []
            })
          );
        }
      } catch (permError) {
        console.error("Failed to load permissions:", permError);
      }

      return { user, accessToken, tenantId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCreator = createAsyncThunk(
  "auth/createCreator",
  async (payload: CreateCreatorPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await AuthService.createCreator(payload);
      const { user, accessToken, refreshToken, tenantId } = response.data;
      storeAuthData(user, accessToken, refreshToken);

      // ✅ Load menu permissions
      try {
        const permResponse: any = await RbacService.getMyAccessibleMenus();
        if (permResponse.data?.success && permResponse.data?.data) {
          dispatch(
            setMenuAccess({
              accessibleMenus: permResponse.data.accessibleMenus || [],
              userPermissions: permResponse.data.userPermissions || []
            })
          );
        }
      } catch (permError) {
        console.error("Failed to load permissions:", permError);
      }

      return { user, accessToken, tenantId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await AuthService.logout();
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    Cookies.remove("user", { path: "/" });
    return null;
  } catch (error: any) {
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    Cookies.remove("user", { path: "/" });
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
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
  "auth/resetPassword",
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
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.getCurrentUser();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ FIXED: Load user from cookies with proper initialization

export const loadUserFromCookies = createAsyncThunk(
  "auth/loadUserFromCookies",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const accessToken = Cookies.get("accessToken");
      const refreshToken = Cookies.get("refreshToken");
      const userCookie = Cookies.get("user");

      // ✅ CRITICAL: Return early if no cookies (public pages)
      if (!accessToken || !userCookie) {
        console.log("⚠️ No authentication cookies found");
        return rejectWithValue("No authentication data found");
      }

      const userData = JSON.parse(userCookie);
      const normalizedUser = normalizeUserData(userData);

      console.log("✅ User loaded from cookies:", {
        id: normalizedUser.id,
        email: normalizedUser.email,
        userType: normalizedUser.userType,
        user_type: normalizedUser.user_type
      });

      // ✅ CRITICAL: Fetch menu permissions immediately after loading user
      try {
        const permissionsResponse: any = await RbacService.getMyAccessibleMenus();

        if (permissionsResponse?.data) {
          dispatch(setUserPermissions(permissionsResponse.data));

          console.log("✅ Menu permissions loaded:", {
            count: permissionsResponse.data.accessibleMenus?.length || 0,
            menus: permissionsResponse.data.accessibleMenus
          });
        }
      } catch (permError) {
        console.error("❌ Failed to load menu permissions:", permError);
        // Don't reject - allow login to proceed
      }

      return {
        user: normalizedUser,
        accessToken,
        refreshToken
      };
    } catch (error: any) {
      console.error("❌ Error loading user from cookies:", error);
      return rejectWithValue(error.message || "Failed to load user data");
    }
  }
);

export const sendInvite = createAsyncThunk(
  "auth/sendInvite",
  async (
    payload: {
      inviteeEmail: string;
      inviteeName: string;
      inviteeType: string;
      roleId: number;
      invitationMessage?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await AuthService.sendInvite(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const resendInvite = createAsyncThunk(
  "auth/resendInvite",
  async (
    payload: {
      invitationId: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await AuthService.resendInvite(payload.invitationId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelInvite = createAsyncThunk(
  "auth/cancelInvite",
  async (
    payload: {
      invitationId: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await AuthService.cancelInvite(payload.invitationId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const acceptInvite = createAsyncThunk(
  "auth/acceptInvite",
  async (
    payload: { token: string; firstName?: string; lastName?: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await AuthService.acceptInvite(payload);
      const { user, accessToken, refreshToken } = response.data;
      storeAuthData(user, accessToken, refreshToken);

      try {
        const permResponse: any = await RbacService.getMyAccessibleMenus();
        if (permResponse.data?.success && permResponse.data?.data) {
          dispatch(
            setMenuAccess({
              accessibleMenus: permResponse.data.accessibleMenus || [],
              userPermissions: permResponse.data.userPermissions || []
            })
          );
        }
      } catch (permError) {
        console.error("Failed to load permissions:", permError);
      }

      return { user, accessToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: "auth",
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
      state.accessToken = Cookies.get("accessToken") || null;
      state.initialized = true; // ✅ Mark as initialized
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        Cookies.set("user", JSON.stringify(state.user), {
          expires: 7,
          path: "/",
          secure: true,
          sameSite: "strict"
        });
      }
    },
    resetAuthState: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.requiresVerification = false;
      state.verificationEmail = null;
      state.initialized = false; // ✅ Reset initialization
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; accessToken: string; refreshToken: string }>
    ) => {
      const normalizedUser = normalizeUserData(action.payload.user);
      state.user = normalizedUser;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.initialized = true;
      state.error = null;
    },

    // ✅ NEW: Store permissions in auth state
    setUserPermissions: (state, action: PayloadAction<any>) => {
      if (state.user) {
        state.user.permissions = action.payload;
      }
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.initialized = false;
      state.error = null;

      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      Cookies.remove("user");
    }
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
        state.initialized = true; // ✅ Mark as initialized
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true; // ✅ Mark as initialized even on error
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
        state.initialized = true; // ✅ Mark as initialized
      })
      .addCase(verifyRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true; // ✅ Mark as initialized
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
        state.initialized = true; // ✅ Mark as initialized
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        if ((action.payload as string).includes("not verified")) {
          state.requiresVerification = true;
        }
        state.initialized = true; // ✅ Mark as initialized
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
        state.initialized = true; // ✅ Mark as initialized
      })
      .addCase(createAgency.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true; // ✅ Mark as initialized
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
        state.initialized = true; // ✅ Mark as initialized
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true; // ✅ Mark as initialized
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
        state.initialized = true; // ✅ Mark as initialized
      })
      .addCase(createCreator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true; // ✅ Mark as initialized
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.initialized = false; // ✅ Reset initialization
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.initialized = false; // ✅ Reset initialization
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
        state.initialized = true; // ✅ Mark as initialized
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true; // ✅ Mark as initialized
      })

      // ✅ FIXED: Load User From Cookies
      .addCase(loadUserFromCookies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserFromCookies.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.initialized = true; // ✅ CRITICAL: Mark as initialized
      })
      .addCase(loadUserFromCookies.rejected, (state, action) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
        state.isLoading = false;
        state.initialized = true; // ✅ CRITICAL: Mark as initialized even on error
      })
      // Add these cases in extraReducers
      .addCase(sendInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendInvite.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(resendInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendInvite.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelInvite.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(cancelInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(acceptInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptInvite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(acceptInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.initialized = true;
      });
  }
});

// ✅ SELECTORS

export const {
  setCredentials,
  clearError,
  setUserPermissions,
  clearVerification,
  setUser,
  updateUser,
  resetAuthState
} = authSlice.actions;

// ✅ CRITICAL: Export selectors that handle both field names
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectError = (state: RootState) => state.auth.error;
export const selectRequiresVerification = (state: RootState) => state.auth.requiresVerification;
export const selectVerificationEmail = (state: RootState) => state.auth.verificationEmail;
export const selectUser = (state: RootState) => state.auth.user;
export const selectUserType = (state: RootState) => {
  const user = state.auth.user;
  return user?.userType || user?.user_type || "pending";
};
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
