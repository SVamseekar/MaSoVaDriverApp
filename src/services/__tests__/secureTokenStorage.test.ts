import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  getTokens,
  setTokens,
  clearTokens,
  migrateLegacyTokens,
} from '../secureTokenStorage';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('secureTokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes tokens to Keychain instead of AsyncStorage', async () => {
    await setTokens('access-123', 'refresh-456');

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'masova-crew',
      JSON.stringify({ accessToken: 'access-123', refreshToken: 'refresh-456' }),
      expect.objectContaining({ service: 'com.masova.crew.auth' })
    );
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('reads tokens from Keychain', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      password: JSON.stringify({ accessToken: 'access-abc', refreshToken: 'refresh-def' }),
    });

    const tokens = await getTokens();

    expect(tokens).toEqual({ accessToken: 'access-abc', refreshToken: 'refresh-def' });
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  });

  it('migrates legacy AsyncStorage tokens to Keychain once', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'auth_accessToken') return 'legacy-access';
      if (key === 'auth_refreshToken') return 'legacy-refresh';
      return null;
    });

    const tokens = await migrateLegacyTokens();

    expect(tokens).toEqual({
      accessToken: 'legacy-access',
      refreshToken: 'legacy-refresh',
    });
    expect(Keychain.setGenericPassword).toHaveBeenCalled();
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      'auth_accessToken',
      'auth_refreshToken',
    ]);
  });

  it('clears Keychain tokens on logout', async () => {
    await clearTokens();
    expect(Keychain.resetGenericPassword).toHaveBeenCalled();
  });
});