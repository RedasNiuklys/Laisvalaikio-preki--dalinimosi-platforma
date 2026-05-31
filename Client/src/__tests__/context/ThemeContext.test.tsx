import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/userApi', () => ({
  updateUserThemePreference: jest.fn().mockResolvedValue(undefined),
}));

import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('ThemeContext', () => {
  it('starts in light mode (isDarkMode = false)', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.isDarkMode).toBe(false);
  });

  it('toggleTheme switches to dark mode and persists to AsyncStorage', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(await AsyncStorage.getItem('theme')).toBe('dark');
  });

  it('toggleTheme twice returns to light mode', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => { await result.current.toggleTheme(); });
    await act(async () => { await result.current.toggleTheme(); });

    expect(result.current.isDarkMode).toBe(false);
    expect(await AsyncStorage.getItem('theme')).toBe('light');
  });

  it('setThemeFromPreference(true) enables dark mode and persists', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await result.current.setThemeFromPreference(true);
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(await AsyncStorage.getItem('theme')).toBe('dark');
  });

  it('setThemeFromPreference(false) sets light mode', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => { await result.current.setThemeFromPreference(true); });
    await act(async () => { await result.current.setThemeFromPreference(false); });

    expect(result.current.isDarkMode).toBe(false);
    expect(await AsyncStorage.getItem('theme')).toBe('light');
  });

  it('theme object changes between light and dark', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    const lightTheme = result.current.theme;

    await act(async () => { await result.current.toggleTheme(); });

    expect(result.current.theme).not.toBe(lightTheme);
  });
});
