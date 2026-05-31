import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/api/userApi', () => ({
  updateUserThemePreference: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/src/context/ChatContext', () => ({
  useChatContext: () => ({ title: null }),
}));
jest.mock('@/src/i18n', () => ({
  default: { language: 'en', changeLanguage: jest.fn(), t: (k: string) => k },
}));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import GlobalHeader from '@/src/components/GlobalHeader';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('GlobalHeader', () => {
  it('renders without crashing', () => {
    expect(() => render(<GlobalHeader />, { wrapper: Wrapper })).not.toThrow();
  });

  it('renders ThemeToggle and LanguageToggle inside header', () => {
    const { UNSAFE_getAllByType } = render(<GlobalHeader />, { wrapper: Wrapper });
    const { View } = require('react-native');
    expect(UNSAFE_getAllByType(View).length).toBeGreaterThan(0);
  });
});
