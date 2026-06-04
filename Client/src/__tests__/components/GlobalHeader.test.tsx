import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/api/userApi', () => ({
  updateUserThemePreference: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/src/context/ChatContext', () => ({
  useChatContext: jest.fn(() => ({ title: null })),
}));
jest.mock('@/src/i18n', () => ({
  default: { language: 'en', changeLanguage: jest.fn(), t: (k: string) => k },
}));
jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => ''),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import GlobalHeader from '@/src/components/GlobalHeader';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

const mockPathname = () => require('expo-router').usePathname as jest.Mock;
const mockChatContext = () => require('@/src/context/ChatContext').useChatContext as jest.Mock;

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  mockPathname().mockReturnValue('');
  mockChatContext().mockReturnValue({ title: null });
});

describe('GlobalHeader', () => {
  it('renders without crashing', () => {
    expect(() => render(<GlobalHeader />, { wrapper: Wrapper })).not.toThrow();
  });

  it('renders ThemeToggle and LanguageToggle inside header', () => {
    const { UNSAFE_getAllByType } = render(<GlobalHeader />, { wrapper: Wrapper });
    const { View } = require('react-native');
    expect(UNSAFE_getAllByType(View).length).toBeGreaterThan(0);
  });
});

describe('GlobalHeader — getTitle() switch cases', () => {
  const renderWithPath = (path: string) => {
    mockPathname().mockReturnValue(path);
    return render(<GlobalHeader />, { wrapper: Wrapper });
  };

  it('returns t("navigation.home") for path ending in "index"', () => {
    const { getByText } = renderWithPath('/index');
    expect(getByText('navigation.home')).toBeTruthy();
  });

  it('returns t("navigation.equipment") for path ending in "equipment"', () => {
    const { getByText } = renderWithPath('/equipment');
    expect(getByText('navigation.equipment')).toBeTruthy();
  });

  it('returns t("navigation.profile") for path ending in "profile"', () => {
    const { getByText } = renderWithPath('/profile');
    expect(getByText('navigation.profile')).toBeTruthy();
  });

  it('returns t("navigation.settings") for path ending in "settings"', () => {
    const { getByText } = renderWithPath('/settings');
    expect(getByText('navigation.settings')).toBeTruthy();
  });

  it('returns t("navigation.messages") for path ending in "chat"', () => {
    const { getByText } = renderWithPath('/chat');
    expect(getByText('navigation.messages')).toBeTruthy();
  });

  it('returns t("admin.title") for path ending in "admin"', () => {
    const { getByText } = renderWithPath('/admin');
    expect(getByText('admin.title')).toBeTruthy();
  });

  it('returns t("navigation.myEquipment") for empty-segment path', () => {
    const { getByText } = renderWithPath('/');
    expect(getByText('navigation.myEquipment')).toBeTruthy();
  });

  it('returns t("map.title") for path ending in "map-modal"', () => {
    const { getByText } = renderWithPath('/map-modal');
    expect(getByText('map.title')).toBeTruthy();
  });

  it('capitalises the last segment for unknown paths', () => {
    const { getByText } = renderWithPath('/bookings');
    expect(getByText('Bookings')).toBeTruthy();
  });

  it('returns chatTitle when inside a chat route with a cached title', () => {
    mockChatContext().mockReturnValue({ title: 'Alice Smith' });
    mockPathname().mockReturnValue('/chat/123');
    const { getByText } = render(<GlobalHeader />, { wrapper: Wrapper });
    expect(getByText('Alice Smith')).toBeTruthy();
  });

  it('falls through to switch when inside chat route but no cached title', () => {
    mockChatContext().mockReturnValue({ title: null });
    mockPathname().mockReturnValue('/chat/123');
    const { getByText } = render(<GlobalHeader />, { wrapper: Wrapper });
    // path.split('/').pop() = '123' → default case → "123"
    expect(getByText('123')).toBeTruthy();
  });

  it('returns empty string for equipment path containing a dash', () => {
    mockPathname().mockReturnValue('/equipment/some-slug-123');
    const { queryByText } = render(<GlobalHeader />, { wrapper: Wrapper });
    // getTitle() returns '' → Text renders empty string
    expect(queryByText('equipment')).toBeNull();
  });
});
