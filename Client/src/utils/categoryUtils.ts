import { TFunction } from 'i18next';
import { Category } from '../types/Category';

export const toCategorySlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getCategoryLabel = (
  category: Pick<Category, 'slug' | 'name'>,
  t: TFunction
): string => {
  const key = category.slug || toCategorySlug(category.name);
  return t(`categories.${key}`, { defaultValue: category.name || key });
};
