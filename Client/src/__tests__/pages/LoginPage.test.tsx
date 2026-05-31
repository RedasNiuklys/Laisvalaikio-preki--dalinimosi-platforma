import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
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
jest.mock('@/src/utils/firebaseConfig');
jest.mock('axios');
jest.mock('@/src/components/OAuthButtons', () => ({ OAuthButtons: () => null }));
jest.mock('@/src/components/OAuthWebHandler', () => () => null);
jest.mock('@/src/components/OAuthMobileHandler', () => () => null);
jest.mock('@/src/components/Toast', () => ({
  showToast: jest.fn(),
  ToastContainer: () => null,
}));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import LoginPage from '@/src/pages/auth/LoginPage';
import { authApi } from '@/src/api/auth';

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      <PaperProvider>{children}</PaperProvider>
    </ThemeProvider>
  </AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  mockAuthApi.logout.mockResolvedValue(undefined);
});

describe('LoginPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<LoginPage />, { wrapper: Wrapper })).not.toThrow();
  });

  it('shows the login title', () => {
    const { getByText } = render(<LoginPage />, { wrapper: Wrapper });
    // i18n mock returns the key: t('auth.login.title') => 'auth.login.title'
    expect(getByText('auth.login.title')).toBeTruthy();
  });

  it('shows the submit button', () => {
    const { getByText } = render(<LoginPage />, { wrapper: Wrapper });
    expect(getByText('auth.login.submit')).toBeTruthy();
  });

  it('shows the forgot password link', () => {
    const { getByText } = render(<LoginPage />, { wrapper: Wrapper });
    expect(getByText('auth.login.forgotPassword')).toBeTruthy();
  });

  it('shows the sign up link', () => {
    const { getByText } = render(<LoginPage />, { wrapper: Wrapper });
    // LoginPage renders noAccount + signUp as a single Text node, so match by substring
    expect(getByText(/auth\.login\.signUp/)).toBeTruthy();
  });
});
