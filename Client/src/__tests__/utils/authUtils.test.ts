import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken, setAuthToken, removeAuthToken } from '@/src/utils/authUtils';

beforeEach(async () => {
  await (AsyncStorage as any).clear();
});

describe('getAuthToken', () => {
  it('returns empty string when no token is stored', async () => {
    const token = await getAuthToken();
    expect(token).toBe('');
  });

  it('returns the stored token', async () => {
    await AsyncStorage.setItem('firebaseToken', 'my-jwt-token');
    const token = await getAuthToken();
    expect(token).toBe('my-jwt-token');
  });
});

describe('setAuthToken', () => {
  it('persists the token in AsyncStorage', async () => {
    await setAuthToken('new-token');
    expect(await AsyncStorage.getItem('firebaseToken')).toBe('new-token');
  });
});

describe('removeAuthToken', () => {
  it('removes the token from AsyncStorage', async () => {
    await AsyncStorage.setItem('firebaseToken', 'token-to-remove');
    await removeAuthToken();
    expect(await AsyncStorage.getItem('firebaseToken')).toBeNull();
  });
});
