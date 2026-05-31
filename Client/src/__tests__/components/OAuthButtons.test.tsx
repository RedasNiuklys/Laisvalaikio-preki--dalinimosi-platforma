import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getUser: jest.fn(),
    register: jest.fn(),
    getFirebaseToken: jest.fn(),
    googleLogin: jest.fn(() => new Promise(() => {})),
    facebookLogin: jest.fn(() => new Promise(() => {})),
    microsoftLogin: jest.fn(() => new Promise(() => {})),
  },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { OAuthButtons } from '@/src/components/OAuthButtons';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('OAuthButtons', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<OAuthButtons />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders Google login button', () => {
    const { getByText } = render(<OAuthButtons />, { wrapper: Wrapper });
    expect(getByText('auth.login.loginWithGoogle')).toBeTruthy();
  });

  it('renders Facebook login button', () => {
    const { getByText } = render(<OAuthButtons />, { wrapper: Wrapper });
    expect(getByText('auth.login.loginWithFacebook')).toBeTruthy();
  });

  it('renders Microsoft login button', () => {
    const { getByText } = render(<OAuthButtons />, { wrapper: Wrapper });
    expect(getByText('auth.login.loginWithMicrosoft')).toBeTruthy();
  });

  it('renders with firstName, lastName props', () => {
    expect(() =>
      render(<OAuthButtons firstName="Alice" lastName="Smith" />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with onSuccess and onError callbacks', () => {
    expect(() =>
      render(
        <OAuthButtons onSuccess={jest.fn()} onError={jest.fn()} />,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });
});
