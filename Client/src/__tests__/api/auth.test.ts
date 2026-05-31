import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/serverOAuthHandler', () => ({
  handleGoogleOAuthServer: jest.fn(),
  handleFacebookOAuthServer: jest.fn(),
  handleMicrosoftOAuthServer: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

// Import after mocks are set up
const getAuthApi = () => require('@/src/api/auth').authApi;

describe('authApi.login', () => {
  it('stores the firebase token in AsyncStorage on success', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { idToken: 'fb-token-123', localId: 'uid-abc' } })
      .mockResolvedValueOnce({ data: { id: 'user-1' } });

    await getAuthApi().login('user@test.com', 'password');

    expect(await AsyncStorage.getItem('firebaseToken')).toBe('fb-token-123');
    expect(await AsyncStorage.getItem('firebaseUid')).toBe('uid-abc');
  });
});

describe('authApi.logout', () => {
  it('removes all auth tokens from AsyncStorage', async () => {
    await AsyncStorage.setItem('firebaseToken', 'old-token');
    await AsyncStorage.setItem('firebaseUid', 'old-uid');
    await AsyncStorage.setItem('facebookAccessToken', 'fb-token');

    await getAuthApi().logout();

    expect(await AsyncStorage.getItem('firebaseToken')).toBeNull();
    expect(await AsyncStorage.getItem('firebaseUid')).toBeNull();
    expect(await AsyncStorage.getItem('facebookAccessToken')).toBeNull();
  });
});

describe('authApi.getUser', () => {
  it('calls the /user/profile endpoint with the stored Bearer token', async () => {
    await AsyncStorage.setItem('firebaseToken', 'my-token');
    mockedAxios.get.mockResolvedValueOnce({ data: { id: 'u1', email: 'user@test.com' } });

    const user = await getAuthApi().getUser();

    const [url, config] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/user/profile');
    expect(config!.headers!.Authorization).toBe('Bearer my-token');
    expect(user.id).toBe('u1');
  });

  it('throws when no token exists in AsyncStorage', async () => {
    await expect(getAuthApi().getUser()).rejects.toThrow('No authentication token');
  });
});
