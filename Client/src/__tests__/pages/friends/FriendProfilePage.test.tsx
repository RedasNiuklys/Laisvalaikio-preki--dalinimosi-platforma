import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/envConfig', () => ({ BASE_URL: 'http://test/api', CHAT_HUB_ENDPOINT: 'ws://test/hub' }));
jest.mock('axios');

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { FriendProfilePage } from '@/src/pages/friends/FriendProfilePage';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('FriendProfilePage', () => {
  it('renders without crashing', () => {
    expect(() => render(<FriendProfilePage />, { wrapper: Wrapper })).not.toThrow();
  });
});
