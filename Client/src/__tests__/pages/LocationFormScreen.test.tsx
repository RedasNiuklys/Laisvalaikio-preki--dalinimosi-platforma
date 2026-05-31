import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/locationApi', () => ({
  createLocation: jest.fn(() => new Promise(() => {})),
  updateLocation: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));
jest.mock('@/src/components/LocationPicker', () => () => null);
jest.mock('react-native-maps', () => ({ default: () => null, Marker: () => null }));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import LocationFormScreen from '@/src/pages/LocationFormScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('LocationFormScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<LocationFormScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('renders in edit mode with a location', () => {
    const location = { id: 'loc-1', name: 'Home', streetAddress: '1 Main', city: 'Vilnius', country: 'LT' };
    expect(() => render(<LocationFormScreen location={location as any} isEditing />, { wrapper: Wrapper })).not.toThrow();
  });

  it('has text inputs for location fields', () => {
    const { UNSAFE_getAllByType } = render(<LocationFormScreen />, { wrapper: Wrapper });
    const { TextInput } = require('react-native');
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThanOrEqual(1);
  });
});
