import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/userApi', () => ({
  getProfile: jest.fn(() => new Promise(() => {})),
  updateUserThemePreference: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images', All: 'All' },
  CameraType: { front: 'front', back: 'back' },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
}));
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn().mockReturnValue({ renderAsync: jest.fn() }) },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  ImageManipulatorContext: {},
  ImageRef: {},
  SaveOptions: {},
  ImageResult: {},
}));
jest.mock('expo-file-system', () => ({
  File: class {},
  Paths: { document: 'file:///docs/' },
  FileInfo: {},
  documentDirectory: 'file:///docs/',
}));
jest.mock('axios');

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import ProfileScreen from '@/src/pages/ProfileScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('ProfileScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProfileScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('shows content or loading state — does not error on mount', () => {
    let error: unknown;
    try {
      render(<ProfileScreen />, { wrapper: Wrapper });
    } catch (e) {
      error = e;
    }
    expect(error).toBeUndefined();
  });
});
