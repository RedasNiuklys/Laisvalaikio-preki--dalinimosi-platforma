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
    googleLogin: jest.fn(),
    facebookLogin: jest.fn(),
    microsoftLogin: jest.fn(),
  },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({
  showToast: jest.fn(),
  ToastContainer: () => null,
}));
jest.mock('@/src/components/OAuthButtons', () => ({ OAuthButtons: () => null }));
jest.mock('@/src/components/OAuthWebHandler', () => () => null);
jest.mock('@/src/components/OAuthMobileHandler', () => () => null);

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import RegisterPage from '@/src/pages/auth/RegisterPage';

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
});

describe('RegisterPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<RegisterPage />, { wrapper: Wrapper })).not.toThrow();
  });

  it('shows the register title', () => {
    const { getByText } = render(<RegisterPage />, { wrapper: Wrapper });
    expect(getByText('auth.register.title')).toBeTruthy();
  });

  it('shows the submit button', () => {
    const { getByText } = render(<RegisterPage />, { wrapper: Wrapper });
    expect(getByText('auth.register.submit')).toBeTruthy();
  });

  it('shows the sign in link', () => {
    const { getByText } = render(<RegisterPage />, { wrapper: Wrapper });
    expect(getByText(/auth\.register\.signIn/)).toBeTruthy();
  });
});
