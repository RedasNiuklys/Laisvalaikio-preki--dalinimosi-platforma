export interface Category {
  id: number;
  name: string;
  slug: string;
  iconName?: string;
  parentCategoryId?: number;
  parentCategory?: Category;
  subcategories?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryEdit {
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  parentCategoryId?: number;
  parentCategory?: Category;
  subcategories?: Category[];
}
