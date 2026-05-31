import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/userApi', () => ({
  updateUserThemePreference: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import ThemeToggle from '@/src/components/ThemeToggle';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('ThemeToggle', () => {
  it('renders without crashing', () => {
    expect(() => render(<ThemeToggle />, { wrapper: Wrapper })).not.toThrow();
  });

  it('renders a button that can be pressed', () => {
    const { getByRole } = render(<ThemeToggle />, { wrapper: Wrapper });
    expect(getByRole('button')).toBeTruthy();
  });

  it('pressing the toggle button does not throw', () => {
    const { getByRole } = render(<ThemeToggle />, { wrapper: Wrapper });
    expect(() => fireEvent.press(getByRole('button'))).not.toThrow();
  });

  it('persists theme to AsyncStorage when toggled', async () => {
    const { getByRole } = render(<ThemeToggle />, { wrapper: Wrapper });
    fireEvent.press(getByRole('button'));
    // Allow async setItem to run
    await new Promise(r => setTimeout(r, 50));
    const stored = await AsyncStorage.getItem('theme');
    expect(['dark', 'light']).toContain(stored);
  });
});
