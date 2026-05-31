import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios', () => ({
  get: jest.fn(() => new Promise(() => {})),
  post: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/utils/authUtils', () => ({ getAuthToken: jest.fn().mockResolvedValue('token') }));
jest.mock('@/src/utils/envConfig', () => ({ BASE_URL: 'http://localhost' }));
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { UserSelector } from '@/src/components/UserSelector';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('UserSelector', () => {
  const baseProps = {
    onUserSelect: jest.fn(),
    selectedUsers: [],
  };

  it('renders without crashing', () => {
    expect(() =>
      render(<UserSelector {...baseProps} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with isMultiSelect=true', () => {
    expect(() =>
      render(<UserSelector {...baseProps} isMultiSelect />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with excludeUsers list', () => {
    expect(() =>
      render(<UserSelector {...baseProps} excludeUsers={['u1', 'u2']} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with selected users', () => {
    const selected = [{ id: 'u1', firstName: 'Alice', lastName: 'Smith', userName: 'alice', email: 'a@b.com' }];
    expect(() =>
      render(<UserSelector {...baseProps} selectedUsers={selected} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders a search bar', () => {
    const { UNSAFE_getByType } = render(<UserSelector {...baseProps} />, { wrapper: Wrapper });
    expect(UNSAFE_getByType(require('react-native-paper').Searchbar)).toBeTruthy();
  });
});
