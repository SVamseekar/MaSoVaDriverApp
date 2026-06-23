/**
 * Secure token storage using iOS Keychain / Android Keystore.
 * Tokens are never persisted in plaintext AsyncStorage.
 */
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYCHAIN_SERVICE = 'com.masova.crew.auth';
const LEGACY_ACCESS_TOKEN_KEY = 'auth_accessToken';
const LEGACY_REFRESH_TOKEN_KEY = 'auth_refreshToken';
const PERSIST_ROOT_KEY = 'persist:root';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

const keychainOptions = {
  service: KEYCHAIN_SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getTokens(): Promise<StoredTokens> {
  try {
    const credentials = await Keychain.getGenericPassword(keychainOptions);
    if (!credentials) {
      return { accessToken: null, refreshToken: null };
    }

    const parsed = JSON.parse(credentials.password) as StoredTokens;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch (error) {
    console.warn('Failed to read tokens from Keychain:', error);
    return { accessToken: null, refreshToken: null };
  }
}

export async function setTokens(
  accessToken: string | null,
  refreshToken: string | null
): Promise<void> {
  if (!accessToken) {
    await clearTokens();
    return;
  }

  try {
    await Keychain.setGenericPassword(
      'masova-crew',
      JSON.stringify({ accessToken, refreshToken }),
      keychainOptions
    );
  } catch (error) {
    console.warn('Failed to write tokens to Keychain:', error);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await Keychain.resetGenericPassword(keychainOptions);
  } catch (error) {
    console.warn('Failed to clear Keychain tokens:', error);
  }
}

/**
 * One-time migration for users who still have tokens in AsyncStorage.
 */
export async function migrateLegacyTokens(): Promise<StoredTokens> {
  const existing = await getTokens();
  if (existing.accessToken) {
    return existing;
  }

  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  const legacyAccess = await AsyncStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  const legacyRefresh = await AsyncStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
  if (legacyAccess) {
    accessToken = legacyAccess;
    refreshToken = legacyRefresh;
  } else {
    const persistRoot = await AsyncStorage.getItem(PERSIST_ROOT_KEY);
    if (persistRoot) {
      try {
        const parsed = JSON.parse(persistRoot) as { auth?: string };
        if (parsed.auth) {
          const authState = JSON.parse(parsed.auth) as {
            accessToken?: string | null;
            refreshToken?: string | null;
          };
          if (authState.accessToken) {
            accessToken = authState.accessToken;
            refreshToken = authState.refreshToken ?? null;

            const strippedAuth = {
              ...authState,
              accessToken: null,
              refreshToken: null,
            };
            parsed.auth = JSON.stringify(strippedAuth);
            await AsyncStorage.setItem(PERSIST_ROOT_KEY, JSON.stringify(parsed));
          }
        }
      } catch (error) {
        console.warn('Failed to migrate tokens from redux-persist storage:', error);
      }
    }
  }

  if (accessToken) {
    await setTokens(accessToken, refreshToken);
    await AsyncStorage.multiRemove([LEGACY_ACCESS_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY]);
  }

  return { accessToken, refreshToken };
}