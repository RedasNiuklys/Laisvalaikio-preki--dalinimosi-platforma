import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsProvider, useSettings } from '@/src/context/SettingsContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('SettingsContext', () => {
  it('provides default settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    expect(result.current.settings).toBeDefined();
    expect(typeof result.current.settings.startWeekOnMonday).toBe('boolean');
  });

  it('updateSettings changes the settings state', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    const newSettings = { startWeekOnMonday: false };

    act(() => {
      result.current.updateSettings(newSettings);
    });

    expect(result.current.settings.startWeekOnMonday).toBe(false);
  });

  it('updateSettings persists to AsyncStorage', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    const newSettings = { startWeekOnMonday: true };

    await act(async () => {
      result.current.updateSettings(newSettings);
    });

    const stored = await AsyncStorage.getItem('appSettings');
    expect(stored).toBe(JSON.stringify(newSettings));
  });

  it('throws when used outside SettingsProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useSettings();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toContain('SettingsProvider');
  });

  it('exposes updateSettings function', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    expect(typeof result.current.updateSettings).toBe('function');
  });
});
