import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/userApi', () => ({
  updateUser: jest.fn(() => new Promise(() => {})),
  updateUserThemePreference: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import EditProfileScreen from '@/src/pages/profile/EditProfileScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('EditProfileScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<EditProfileScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('shows the save button', () => {
    const { getByText } = render(<EditProfileScreen />, { wrapper: Wrapper });
    expect(getByText('common.buttons.save')).toBeTruthy();
  });

  it('has at least 3 text input fields (userName, firstName, lastName)', () => {
    const { UNSAFE_getAllByType } = render(<EditProfileScreen />, { wrapper: Wrapper });
    // react-native-paper TextInput wraps a react-native TextInput
    const { TextInput } = require('react-native');
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThanOrEqual(3);
  });
});
