import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/user';

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
  ACCESS_TOKEN: 'auth_accessToken',
  REFRESH_TOKEN: 'auth_refreshToken',
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
    await Promise.all(
      Object.values(STORAGE_KEYS).map(key => removeStorage(key))
    );
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

const loadAccessTokenFromStorage = async (): Promise<string | null> => {
  return await getStorage(STORAGE_KEYS.ACCESS_TOKEN);
};

const loadRefreshTokenFromStorage = async (): Promise<string | null> => {
  return await getStorage(STORAGE_KEYS.REFRESH_TOKEN);
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

      // Storage is handled by redux-persist
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    refreshTokenSuccess: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
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
