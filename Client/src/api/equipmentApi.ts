import axios from 'axios';
import { Equipment } from '../types/Equipment';
import { getAuthToken } from '../utils/authUtils';
import { EQUIPMENT_ENDPOINT } from '../utils/envConfig';

const API_URL = EQUIPMENT_ENDPOINT;

// Get all equipment
export const getEquipment = async (): Promise<Equipment[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Get equipment by ID
export const getEquipmentById = async (id: string): Promise<Equipment> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Create new equipment
export const createEquipment = async (equipment: Omit<Equipment, 'id'>): Promise<Equipment> => {
    const token = await getAuthToken();
    const response = await axios.post(`${API_URL}`, equipment, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Update equipment
export const updateEquipment = async (id: string, equipment: Partial<Equipment>): Promise<Equipment> => {
    const token = await getAuthToken();
    const response = await axios.put(`${API_URL}/${id}`, equipment, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Delete equipment
export const deleteEquipment = async (id: string): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Get equipment by location
export const getEquipmentByLocation = async (locationId: string): Promise<Equipment[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/location/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Get equipment by owner
export const getEquipmentByOwner = async (ownerId: string): Promise<Equipment[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}; 