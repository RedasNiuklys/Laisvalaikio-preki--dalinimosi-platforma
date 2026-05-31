import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

jest.mock('@/src/api/userApi', () => ({
  getUsers: jest.fn(() => new Promise(() => {})),
  getUserById: jest.fn(() => new Promise(() => {})),
  createUser: jest.fn(() => new Promise(() => {})),
  updateUser: jest.fn(() => new Promise(() => {})),
  deleteUser: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: {} }),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));
jest.mock('axios');

import UserFormScreen from '@/src/pages/UserFormScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('UserFormScreen', () => {
  it('renders without crashing', () => {
    expect(() => render(<UserFormScreen />, { wrapper: Wrapper })).not.toThrow();
  });
});
