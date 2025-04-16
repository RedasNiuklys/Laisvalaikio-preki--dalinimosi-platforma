export interface Category {
    id: number;
    name: string;
    description?: string;
    iconName?: string;
    parentCategoryId?: number;
    parentCategory?: Category;
    subcategories?: Category[];
    createdAt: Date;
    updatedAt?: Date;
} 