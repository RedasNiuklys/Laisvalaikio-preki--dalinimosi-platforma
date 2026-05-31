import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/authUtils', () => ({ getAuthToken: jest.fn().mockResolvedValue('token') }));
jest.mock('@/src/utils/envConfig', () => ({ BASE_URL: 'http://localhost' }));
jest.mock('@/src/styles/globalStyles', () => ({
  globalStyles: { container: {} },
  colors: { primary: '#000', secondary: '#fff' },
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { UserSearch } from '@/src/components/UserSearch';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('UserSearch', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<UserSearch onUserSelect={jest.fn()} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders a search input', () => {
    const { UNSAFE_getByType } = render(
      <UserSearch onUserSelect={jest.fn()} />,
      { wrapper: Wrapper }
    );
    expect(UNSAFE_getByType(require('react-native-paper').Searchbar)).toBeTruthy();
  });

  it('renders with loading=true', () => {
    expect(() =>
      render(<UserSearch onUserSelect={jest.fn()} loading />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with loading=false', () => {
    expect(() =>
      render(<UserSearch onUserSelect={jest.fn()} loading={false} />, { wrapper: Wrapper })
    ).not.toThrow();
  });
});
