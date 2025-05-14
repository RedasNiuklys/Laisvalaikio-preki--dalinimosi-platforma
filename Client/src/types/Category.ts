export interface Category {
    id: number;
    name: string;
    iconName: string;
    categoryId?: number;
    category?: Category;
    subcategories?: Category[];
    createdAt?: string;
    updatedAt?: string;
}
export interface CategoryEdit {
    name: string;
    description: string;
    iconName: string;
    parentCategoryId?: number;
    parentCategory?: Category;
    subcategories?: Category[];
}
