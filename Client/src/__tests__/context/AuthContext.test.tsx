import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getUser: jest.fn(),
    register: jest.fn(),
    getFirebaseToken: jest.fn(),
    googleLogin: jest.fn(),
    facebookLogin: jest.fn(),
    microsoftLogin: jest.fn(),
  },
}));

// Import after mocks are declared
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
const { authApi } = require('@/src/api/auth');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  authApi.logout.mockResolvedValue(undefined);
});

describe('initial state', () => {
  it('starts unauthenticated with null user and token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

describe('login', () => {
  it('sets isAuthenticated to true and populates user on success', async () => {
    authApi.login.mockImplementation(async () => {
      await AsyncStorage.setItem('firebaseToken', 'test-token');
    });
    authApi.getUser.mockResolvedValue({ id: 'u1', email: 'user@test.com' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.login('user@test.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 'u1', email: 'user@test.com' });
    expect(result.current.token).toBe('test-token');
  });

  it('stays unauthenticated when authApi.login throws', async () => {
    authApi.login.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      try { await result.current.login('bad@test.com', 'wrong'); } catch {}
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('stays unauthenticated when no token is stored after login', async () => {
    authApi.login.mockResolvedValue(undefined); // Does NOT set AsyncStorage

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      try { await result.current.login('user@test.com', 'password'); } catch {}
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('logout', () => {
  it('resets all auth state after logout', async () => {
    authApi.login.mockImplementation(async () => {
      await AsyncStorage.setItem('firebaseToken', 'auth-token');
    });
    authApi.getUser.mockResolvedValue({ id: 'u1', email: 'user@test.com' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.login('user@test.com', 'password'); });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => { await result.current.logout(); });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
