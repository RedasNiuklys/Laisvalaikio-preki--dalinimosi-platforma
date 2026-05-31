import { toCategorySlug, getCategoryLabel } from '@/src/utils/categoryUtils';

describe('toCategorySlug', () => {
  it('lowercases and trims whitespace', () => {
    expect(toCategorySlug('  Sports  ')).toBe('sports');
  });

  it('replaces spaces and special characters with hyphens', () => {
    expect(toCategorySlug('Outdoor & Sports')).toBe('outdoor-sports');
  });

  it('collapses multiple consecutive special chars into one hyphen', () => {
    expect(toCategorySlug('Hello   World!!!')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toCategorySlug('--hello--')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(toCategorySlug('')).toBe('');
  });

  it('handles already-valid slug', () => {
    expect(toCategorySlug('power-tools')).toBe('power-tools');
  });
});

describe('getCategoryLabel', () => {
  const mockT = jest.fn((key: string, opts?: any) =>
    opts?.defaultValue != null ? opts.defaultValue : key
  );

  beforeEach(() => mockT.mockClear());

  it('passes categories.<slug> as the i18n key when slug is present', () => {
    getCategoryLabel({ slug: 'sports', name: 'Sports' }, mockT as any);
    expect(mockT).toHaveBeenCalledWith('categories.sports', { defaultValue: 'Sports' });
  });

  it('falls back to slugifying the name when slug is empty', () => {
    getCategoryLabel({ slug: '', name: 'Outdoor Sports' }, mockT as any);
    expect(mockT).toHaveBeenCalledWith('categories.outdoor-sports', { defaultValue: 'Outdoor Sports' });
  });

  it('returns the defaultValue from the translation function', () => {
    const result = getCategoryLabel({ slug: 'tools', name: 'Tools' }, mockT as any);
    expect(result).toBe('Tools');
  });
});
