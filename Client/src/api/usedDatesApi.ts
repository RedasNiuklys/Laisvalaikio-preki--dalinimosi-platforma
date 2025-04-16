import axios from 'axios';
import { UsedDates } from '../types/UsedDates';
import { getAuthToken } from '../utils/authUtils';

const API_URL = 'http://localhost:5000/api';

// Get all used dates for an equipment
export const getUsedDatesForEquipment = async (equipmentId: string): Promise<UsedDates[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/useddates/equipment/${equipmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Get all used dates for a user
export const getUsedDatesForUser = async (userId: string): Promise<UsedDates[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/useddates/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Create new used dates
export const createUsedDates = async (usedDates: Omit<UsedDates, 'id'>): Promise<UsedDates> => {
    const token = await getAuthToken();
    const response = await axios.post(`${API_URL}/useddates`, usedDates, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Update used dates
export const updateUsedDates = async (id: string, usedDates: Partial<UsedDates>): Promise<UsedDates> => {
    const token = await getAuthToken();
    const response = await axios.put(`${API_URL}/useddates/${id}`, usedDates, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Delete used dates
export const deleteUsedDates = async (id: string): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${API_URL}/useddates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Check if equipment is available for specific dates
export const checkAvailability = async (equipmentId: string, startDate: Date, endDate: Date): Promise<boolean> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/useddates/check-availability`, {
        params: { equipmentId, startDate, endDate },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.available;
}; 