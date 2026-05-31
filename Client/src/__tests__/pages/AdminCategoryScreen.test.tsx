import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/categoryApi', () => ({
  getCategories: jest.fn(() => new Promise(() => {})),
  getCategoryById: jest.fn(() => new Promise(() => {})),
  createCategory: jest.fn(() => new Promise(() => {})),
  updateCategory: jest.fn(() => new Promise(() => {})),
  deleteCategory: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import AdminCategoryScreen from '@/src/pages/AdminCategoryScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('AdminCategoryScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<AdminCategoryScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('renders with categoryId (edit mode)', () => {
    expect(() => render(<AdminCategoryScreen categoryId={1} />, { wrapper: Wrapper })).not.toThrow();
  });

  it('shows the name input field', () => {
    const { UNSAFE_getAllByType } = render(<AdminCategoryScreen />, { wrapper: Wrapper });
    const { TextInput } = require('react-native');
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThanOrEqual(1);
  });
});
