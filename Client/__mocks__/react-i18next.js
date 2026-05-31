module.exports = {
  useTranslation: () => ({
    t: (key, opts) => (opts && opts.defaultValue != null ? opts.defaultValue : key),
    i18n: { changeLanguage: jest.fn(), language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  Trans: ({ children }) => children,
  I18nextProvider: ({ children }) => children,
};
