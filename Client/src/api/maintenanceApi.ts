import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';
import { MAINTENANCE_ENDPOINT } from '../utils/envConfig';

export interface MaintenanceRecord {
    id: number;
    equipmentId: string;
    title: string;
    description: string;
    maintenanceDate: string;
    performedBy: string;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateMaintenanceRecordDto {
    equipmentId: string;
    title: string;
    description: string;
    maintenanceDate: string; // ISO date string
    performedBy: string;
    notes?: string;
    setUnavailable?: boolean;
}

export interface UpdateMaintenanceRecordDto {
    title?: string;
    description?: string;
    maintenanceDate?: string;
    performedBy?: string;
    notes?: string;
}

export const getByEquipment = async (equipmentId: string): Promise<MaintenanceRecord[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${MAINTENANCE_ENDPOINT}/equipment/${equipmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const create = async (dto: CreateMaintenanceRecordDto): Promise<MaintenanceRecord> => {
    const token = await getAuthToken();
    const response = await axios.post(MAINTENANCE_ENDPOINT, dto, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const update = async (id: number, dto: UpdateMaintenanceRecordDto): Promise<MaintenanceRecord> => {
    const token = await getAuthToken();
    const response = await axios.put(`${MAINTENANCE_ENDPOINT}/${id}`, dto, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const remove = async (id: number): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${MAINTENANCE_ENDPOINT}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
