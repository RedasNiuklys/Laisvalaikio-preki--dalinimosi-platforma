import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const getAuthApi = () => require('@/src/api/auth').authApi;

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/serverOAuthHandler', () => ({
  handleGoogleOAuthServer: jest.fn(),
  handleFacebookOAuthServer: jest.fn(),
  handleMicrosoftOAuthServer: jest.fn(),
}));
jest.mock('expo-web-browser', () => ({
  coolDownAsync: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
  maybeCompleteAuthSession: jest.fn(),
}));
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('exp://redirect'),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const TOKEN = 'test-firebase-token';

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('authApi.logout', () => {
  it('removes firebaseToken from AsyncStorage', async () => {
    await AsyncStorage.setItem('firebaseToken', TOKEN);
    await getAuthApi().logout();
    const stored = await AsyncStorage.getItem('firebaseToken');
    expect(stored).toBeNull();
  });

  it('removes firebaseUid from AsyncStorage', async () => {
    await AsyncStorage.setItem('firebaseUid', 'uid-123');
    await getAuthApi().logout();
    const stored = await AsyncStorage.getItem('firebaseUid');
    expect(stored).toBeNull();
  });

  it('removes Facebook tokens from AsyncStorage', async () => {
    await AsyncStorage.setItem('facebookAccessToken', 'fb-token');
    await getAuthApi().logout();
    const stored = await AsyncStorage.getItem('facebookAccessToken');
    expect(stored).toBeNull();
  });
});

describe('authApi.getFirebaseToken', () => {
  it('returns the stored token', async () => {
    await AsyncStorage.setItem('firebaseToken', TOKEN);
    const result = await getAuthApi().getFirebaseToken();
    expect(result).toBe(TOKEN);
  });

  it('returns null when no token stored', async () => {
    const result = await getAuthApi().getFirebaseToken();
    expect(result).toBeNull();
  });
});

describe('authApi.getUser', () => {
  it('throws when no token in AsyncStorage', async () => {
    await expect(getAuthApi().getUser()).rejects.toThrow('No authentication token');
  });

  it('calls backend profile endpoint with Bearer token', async () => {
    await AsyncStorage.setItem('firebaseToken', TOKEN);
    const mockUser = { id: 'u-1', email: 'test@test.com' };
    mockedAxios.get.mockResolvedValueOnce({ data: mockUser });

    const result = await getAuthApi().getUser();

    const [url, config] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/profile');
    expect(config!.headers!.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(result).toEqual(mockUser);
  });

  it('re-throws on request failure', async () => {
    await AsyncStorage.setItem('firebaseToken', TOKEN);
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    await expect(getAuthApi().getUser()).rejects.toThrow('network error');
  });
});

describe('authApi.register', () => {
  it('calls Firebase signUp and backend registration', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { idToken: 'id-token', localId: 'uid-new' } })
      .mockResolvedValueOnce({ data: { id: 'u-new', email: 'new@test.com' } });

    const result = await getAuthApi().register('new@test.com', 'password123', 'Alice', 'Smith');

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ user: { id: 'u-new', email: 'new@test.com' }, token: 'id-token' });
  });
});
