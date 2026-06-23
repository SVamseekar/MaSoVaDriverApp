import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/user';
import { clearTokens, setTokens } from '../../services/secureTokenStorage';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  lastLoginAttempt: string | null;
}

// ============================================================================
// ASYNC STORAGE - React Native adaptation
// ============================================================================

const STORAGE_KEYS = {
  USER: 'auth_user',
} as const;

const getStorage = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn('Storage access denied:', error);
    return null;
  }
};

const setStorage = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
};

const removeStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('Storage removal failed:', error);
  }
};

/**
 * Clear ALL auth data from storage
 * Called on logout and before new login
 */
export const clearAllAuthStorage = async (): Promise<void> => {
  try {
    await Promise.all([
      removeStorage(STORAGE_KEYS.USER),
      clearTokens(),
    ]);
  } catch (error) {
    console.warn('Storage cleanup failed:', error);
  }
};

// Load functions
const loadUserFromStorage = async (): Promise<User | null> => {
  try {
    const userStr = await getStorage(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// Initial state - will be hydrated by redux-persist
const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
  lastLoginAttempt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
      state.lastLoginAttempt = new Date().toISOString();
    },
    loginSuccess: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>) => {
      const { accessToken, refreshToken, user } = action.payload;

      state.isAuthenticated = true;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.loading = false;
      state.error = null;

      void setTokens(accessToken, refreshToken);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = action.payload;
      void clearTokens();
      void removeStorage(STORAGE_KEYS.USER);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      void clearTokens();
      void removeStorage(STORAGE_KEYS.USER);
    },
    refreshTokenSuccess: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      void setTokens(action.payload, state.refreshToken);
    },
    hydrateTokens: (
      state,
      action: PayloadAction<{ accessToken: string | null; refreshToken: string | null }>
    ) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = !!accessToken && !!state.user;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  refreshTokenSuccess,
  hydrateTokens,
  updateUserProfile,
  clearError,
  setLoading,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;
