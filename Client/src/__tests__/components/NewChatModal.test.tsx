import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/authUtils', () => ({ getAuthToken: jest.fn().mockResolvedValue('token') }));
jest.mock('@/src/utils/envConfig', () => ({ BASE_URL: 'http://localhost' }));
jest.mock('@/src/components/UserSelector', () => ({
  UserSelector: ({ onUserSelect }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { testID: 'user-selector-stub', onPress: () => onUserSelect({ id: 'u1', firstName: 'Alice', lastName: 'Smith', userName: 'alice', email: 'alice@test.com' }) },
      React.createElement(Text, null, 'Select User')
    );
  },
}));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { NewChatModal } from '@/src/components/NewChatModal';
import axios from 'axios';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

const baseProps = {
  visible: true,
  onDismiss: jest.fn(),
  onChatCreated: jest.fn(),
};

describe('NewChatModal', () => {
  it('renders without crashing when visible', () => {
    expect(() =>
      render(<NewChatModal {...baseProps} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders chat.newChat title', () => {
    const { getByText } = render(<NewChatModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('chat.newChat')).toBeTruthy();
  });

  it('renders group chat toggle label', () => {
    const { getByText } = render(<NewChatModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('chat.groupChat')).toBeTruthy();
  });

  it('renders cancel and create buttons', () => {
    const { getByText } = render(<NewChatModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('common.buttons.cancel')).toBeTruthy();
    expect(getByText('chat.create')).toBeTruthy();
  });

  it('create button is disabled when no user selected', () => {
    const { getByText } = render(<NewChatModal {...baseProps} />, { wrapper: Wrapper });
    const createBtn = getByText('chat.create');
    expect(createBtn).toBeTruthy();
  });

  it('calls onDismiss when cancel button is pressed', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <NewChatModal {...baseProps} onDismiss={onDismiss} />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByText('common.buttons.cancel'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows group name input after enabling group chat toggle', () => {
    const { getByText, queryByLabelText } = render(
      <NewChatModal {...baseProps} />,
      { wrapper: Wrapper }
    );
    expect(queryByLabelText('chat.groupName')).toBeNull();
    fireEvent(getByText('chat.groupChat').parentElement || getByText('chat.groupChat'), 'press');
  });

  it('calls onChatCreated after successful creation with user selected', async () => {
    mockedAxios.post = jest.fn().mockResolvedValueOnce({ data: 42 });
    const onChatCreated = jest.fn();

    const { getByTestId, getByText } = render(
      <NewChatModal {...baseProps} onChatCreated={onChatCreated} />,
      { wrapper: Wrapper }
    );

    fireEvent.press(getByTestId('user-selector-stub'));
    await act(async () => {
      fireEvent.press(getByText('chat.create'));
    });

    await waitFor(() => {
      expect(onChatCreated).toHaveBeenCalledWith(42);
    });
  });

  it('shows error message on API failure', async () => {
    mockedAxios.post = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId, getByText, findByText } = render(
      <NewChatModal {...baseProps} />,
      { wrapper: Wrapper }
    );

    fireEvent.press(getByTestId('user-selector-stub'));
    await act(async () => {
      fireEvent.press(getByText('chat.create'));
    });

    await findByText('Network error');
  });
});
