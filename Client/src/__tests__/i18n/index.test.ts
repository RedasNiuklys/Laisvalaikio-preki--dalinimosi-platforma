import i18n, { changeLanguage } from '@/src/i18n';

describe('i18n', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('is initialized after import', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('defaults to English', () => {
    expect(i18n.language).toBe('en');
  });

  it('translates a known English key', () => {
    const val = i18n.t('auth.login.title');
    expect(typeof val).toBe('string');
    expect(val.length).toBeGreaterThan(0);
  });

  it('changeLanguage switches to lt', async () => {
    await changeLanguage('lt');
    expect(i18n.language).toBe('lt');
  });

  it('changeLanguage switches back to en', async () => {
    await changeLanguage('lt');
    await changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('returns key for missing translation', () => {
    const val = i18n.t('nonexistent.key.that.does.not.exist');
    expect(typeof val).toBe('string');
  });
});
