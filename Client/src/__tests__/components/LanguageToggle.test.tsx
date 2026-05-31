import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

jest.mock('@/src/i18n', () => ({
  __esModule: true,
  default: {
    language: 'en',
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    t: (key: string) => key,
  },
}));

import LanguageToggle from '@/src/components/LanguageToggle';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('LanguageToggle', () => {
  it('renders without crashing', () => {
    expect(() => render(<LanguageToggle />, { wrapper: Wrapper })).not.toThrow();
  });

  it('shows English option after opening menu', async () => {
    const { findByText, getByRole } = render(<LanguageToggle />, { wrapper: Wrapper });
    fireEvent.press(getByRole('button'));
    const el = await findByText('English');
    expect(el).toBeTruthy();
  });

  it('shows Lithuanian option after opening menu', async () => {
    const { findByText, getByRole } = render(<LanguageToggle />, { wrapper: Wrapper });
    fireEvent.press(getByRole('button'));
    const el = await findByText('Lietuvių');
    expect(el).toBeTruthy();
  });

  it('calls i18n.changeLanguage when English is selected', async () => {
    const i18n = require('@/src/i18n').default;
    const { findByText, getByRole } = render(<LanguageToggle />, { wrapper: Wrapper });
    fireEvent.press(getByRole('button'));
    fireEvent.press(await findByText('English'));
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
  });
});
