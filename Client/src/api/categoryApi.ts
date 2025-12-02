import axios from 'axios';
import { Category } from '../types/Category';
import { getAuthToken } from '../utils/authUtils';
import { CATEGORY_ENDPOINT } from '../utils/envConfig';

const API_URL = CATEGORY_ENDPOINT;

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
    const token = await getAuthToken();
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("response", response.data);
    return response.data;
};

// Get category by ID
export const getCategoryById = async (id: number): Promise<Category> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Create new category
export const createCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    const token = await getAuthToken();
    const response = await axios.post(API_URL, category, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Update category
export const updateCategory = async (id: number, category: Partial<Category>): Promise<Category> => {
    const token = await getAuthToken();
    const response = await axios.put(`${API_URL}/${id}`, category, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Delete category
export const deleteCategory = async (id: number): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Get subcategories
export const getSubcategories = async (parentId: number): Promise<Category[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/${parentId}/subcategories`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}; 