import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/locationApi', () => ({
  getLocations: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));
jest.mock('@/src/components/LocationMap', () => () => null);
jest.mock('react-native-maps', () => ({ default: () => null, Marker: () => null }));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import LocationListScreen from '@/src/pages/LocationListScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('LocationListScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<LocationListScreen />, { wrapper: Wrapper })).not.toThrow();
  });
});
