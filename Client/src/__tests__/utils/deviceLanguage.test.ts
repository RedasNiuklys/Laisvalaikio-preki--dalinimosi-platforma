jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

import { getLocales } from 'expo-localization';
import useDeviceLanguage from '@/src/utils/deviceLanguage';

const mockedGetLocales = getLocales as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useDeviceLanguage', () => {
  it('returns "lt" when device language is Lithuanian', () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'lt' }]);
    const { getDeviceLanguage } = useDeviceLanguage();
    expect(getDeviceLanguage()).toBe('lt');
  });

  it('returns "en" when device language is English', () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    const { getDeviceLanguage } = useDeviceLanguage();
    expect(getDeviceLanguage()).toBe('en');
  });

  it('returns "en" for other languages (fallback)', () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'de' }]);
    const { getDeviceLanguage } = useDeviceLanguage();
    expect(getDeviceLanguage()).toBe('en');
  });

  it('returns "en" when locales array is empty', () => {
    mockedGetLocales.mockReturnValue([]);
    const { getDeviceLanguage } = useDeviceLanguage();
    expect(getDeviceLanguage()).toBe('en');
  });

  it('returns "en" when languageCode is null', () => {
    mockedGetLocales.mockReturnValue([{ languageCode: null }]);
    const { getDeviceLanguage } = useDeviceLanguage();
    expect(getDeviceLanguage()).toBe('en');
  });

  it('returns "en" when getLocales throws an error', () => {
    mockedGetLocales.mockImplementation(() => { throw new Error('localization error'); });
    const { getDeviceLanguage } = useDeviceLanguage();
    expect(getDeviceLanguage()).toBe('en');
  });
});
