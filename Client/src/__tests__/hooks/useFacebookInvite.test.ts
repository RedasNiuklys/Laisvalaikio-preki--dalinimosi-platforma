jest.mock('@/src/utils/firebaseConfig', () => ({
  FIREBASE_DYNAMIC_LINKS: { domainUriPrefix: '', shortLinksEndpoint: '' },
  firebaseConfig: { apiKey: '' },
  FIREBASE_REST_API: {},
  OAUTH_CONFIG: { google: {}, facebook: {}, microsoft: {} },
  CLIENT_BASE_URL: '',
  SERVER_URL: '',
}));
jest.mock('axios');
jest.mock('@/src/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    authProvider: null,
    logout: jest.fn(),
    loadUser: jest.fn(),
  })),
  AuthProvider: ({ children }: any) => children,
}));

import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFacebookInvite } from '@/src/hooks/useFacebookInvite';

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useFacebookInvite', () => {
  it('returns inviteFriends function and loading=false initially', () => {
    const { result } = renderHook(() => useFacebookInvite());
    expect(typeof result.current.inviteFriends).toBe('function');
    expect(result.current.loading).toBe(false);
  });

  it('returns error when no Facebook access token is stored', async () => {
    const { result } = renderHook(() => useFacebookInvite());
    let inviteResult: any;
    await act(async () => {
      inviteResult = await result.current.inviteFriends();
    });
    expect(inviteResult.success).toBe(false);
    expect(inviteResult.error).toMatch(/Facebook access token not found/i);
  });

  it('sets loading to false after error', async () => {
    const { result } = renderHook(() => useFacebookInvite());
    await act(async () => {
      await result.current.inviteFriends();
    });
    expect(result.current.loading).toBe(false);
  });

  it('returns error when token present but user not loaded', async () => {
    await AsyncStorage.setItem('facebookAccessToken', 'fb-token-123');
    const { result } = renderHook(() => useFacebookInvite());
    let inviteResult: any;
    await act(async () => {
      inviteResult = await result.current.inviteFriends();
    });
    expect(inviteResult.success).toBe(false);
    expect(inviteResult.error).toMatch(/user information not loaded/i);
  });

  it('sets loading false regardless of outcome', async () => {
    const { result } = renderHook(() => useFacebookInvite());
    await act(async () => {
      await result.current.inviteFriends();
    });
    expect(result.current.loading).toBe(false);
  });
});
