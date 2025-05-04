import { Location } from './Location';
import { UsedDates } from './UsedDates';

export type EquipmentCondition = 'Good' | 'Fair' | 'Poor' | 'Needs Repair';

export interface EquipmentImage {
    id: number;
    equipmentId: number;
    imageUrl: string;
    isMainImage: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface MaintenanceRecord {
    id: number;
    equipmentId: number;
    title: string;
    description: string;
    maintenanceDate: Date;
    performedBy: string;
    notes?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Equipment {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    locationId?: string;
    condition: string;
    isAvailable: boolean;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEquipmentDto {
    name: string;
    description: string;
    locationId?: string;
    condition: string;
    isAvailable: boolean;
}

export interface UpdateEquipmentDto {
    name?: string;
    description?: string;
    locationId?: string;
    condition?: string;
    isAvailable?: boolean;
} 