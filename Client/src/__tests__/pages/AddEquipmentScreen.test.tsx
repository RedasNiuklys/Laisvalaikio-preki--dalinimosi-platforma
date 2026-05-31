import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/locationApi', () => ({
  getByOwner: jest.fn(() => new Promise(() => {})),
  create: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/equipmentApi', () => ({
  create: jest.fn(() => new Promise(() => {})),
  update: jest.fn(() => new Promise(() => {})),
  getById: jest.fn(() => new Promise(() => {})),
  uploadImage: jest.fn(() => new Promise(() => {})),
  deleteImage: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/categoryApi', () => ({
  getCategories: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));
jest.mock('@/src/components/ImageList', () => ({ ImageList: () => null }));
jest.mock('@/src/pages/LocationFormScreen', () => () => null);
jest.mock('@react-native-picker/picker', () => ({ Picker: () => null }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('expo-file-system', () => ({ documentDirectory: 'file:///docs/', getInfoAsync: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: { manipulate: jest.fn() }, SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import AddEquipmentScreen from '@/src/pages/AddEquipmentScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('AddEquipmentScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<AddEquipmentScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('renders with equipmentId prop (edit mode)', () => {
    expect(() => render(<AddEquipmentScreen equipmentId="eq-1" />, { wrapper: Wrapper })).not.toThrow();
  });
});
