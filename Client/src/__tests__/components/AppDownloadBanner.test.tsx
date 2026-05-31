import React from 'react';
import { render } from '@testing-library/react-native';

// AppDownloadBanner only shows on web (Platform.OS === 'web').
// In Jest the env is 'ios', so the component returns null immediately.
// Mock the ThemeContext directly so we don't need a wrapper — toJSON() stays null.

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@/src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: { colors: { primary: '#333', onPrimary: '#fff' } },
    isDarkMode: false,
    toggleTheme: jest.fn(),
    setThemeFromPreference: jest.fn(),
  }),
}));

import AppDownloadBanner from '@/src/components/AppDownloadBanner';

describe('AppDownloadBanner', () => {
  it('renders without crashing on non-web platform', () => {
    expect(() => render(<AppDownloadBanner />)).not.toThrow();
  });

  it('returns null on non-web platform (Platform.OS !== web)', () => {
    const { toJSON } = render(<AppDownloadBanner />);
    // On non-web the component returns null (no banner)
    expect(toJSON()).toBeNull();
  });
});
