import axios from 'axios';
import { Platform } from 'react-native';
import { CreateEquipmentDto, Equipment } from '../types/Equipment';
import { getAuthToken } from '../utils/authUtils';
import { EQUIPMENT_ENDPOINT } from '../utils/envConfig';

export const getAll = async (): Promise<Equipment[]> => {
    const token = await getAuthToken();
    const response = await axios.get(EQUIPMENT_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export const getByOwner = async (ownerId: string): Promise<Equipment[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${EQUIPMENT_ENDPOINT}/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export const getById = async (id: string): Promise<Equipment> => {
    const token = await getAuthToken();
    const response = await axios.get(`${EQUIPMENT_ENDPOINT}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export const create = async (equipment: CreateEquipmentDto): Promise<Equipment> => {
    const token = await getAuthToken();
    //console.log

    const response = await axios.post(`${EQUIPMENT_ENDPOINT}`, equipment, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return response.data;
}

export const update = async (id: string, equipment: Partial<Equipment>): Promise<Equipment> => {
    const token = await getAuthToken();
    const response = await axios.put(`${EQUIPMENT_ENDPOINT}/${id}`, equipment, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export const deleteEquipment = async (id: string): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${EQUIPMENT_ENDPOINT}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export const getByCategory = async (category: string): Promise<Equipment[]> => {
    const token = await getAuthToken();
    const response = await axios.get<Equipment[]>(`${EQUIPMENT_ENDPOINT}/category/${category}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

// Upload equipment image
export const uploadImage = async (equipmentId: string, imageUri: string, isMainImage: boolean = false): Promise<void> => {
    const token = await getAuthToken();
    const formData = new FormData();

    if (Platform.OS === 'web') {
        // Web platform handling
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        formData.append("file", file);
    } else {
        // Native platform handling
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'image.jpg'
        } as any);
    }

    formData.append('isMainImage', isMainImage.toString());

    await axios.post(`${EQUIPMENT_ENDPOINT}/${equipmentId}/images`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
}

export const deleteImage = async (equipmentId: string, imageId: string): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${EQUIPMENT_ENDPOINT}/${equipmentId}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

// Add maintenance record
export const addMaintenanceRecord = async (equipmentId: string, record: {
    title: string;
    description: string;
    maintenanceDate: Date;
    performedBy: string;
    notes?: string;
}): Promise<void> => {
    const token = await getAuthToken();
    await axios.post(`${EQUIPMENT_ENDPOINT}/${equipmentId}/maintenance`, record, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export const addUsedDate = async (equipmentId: string, date: Date): Promise<Equipment> => {
    const token = await getAuthToken();
    const response = await axios.post(`${EQUIPMENT_ENDPOINT}/${equipmentId}/used-dates`, { date }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const removeUsedDate = async (equipmentId: string, date: Date): Promise<Equipment> => {
    const token = await getAuthToken();
    const response = await axios.delete(`${EQUIPMENT_ENDPOINT}/${equipmentId}/used-dates`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { date }
    });
    return response.data;
};