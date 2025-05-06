import { Location } from './Location';
import { UsedDates } from './UsedDates';

export type EquipmentCondition = 'Good' | 'Fair' | 'Poor' | 'Needs Repair';

export interface EquipmentImage {
    id: number;
    equipmentId: string;
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

export interface EquipmentResponseDto extends CreateEquipmentDto {
    id: string;
    ownerId: string;
    status: string;
    createdAt: Date;
    updatedAt?: Date;
    location: Location;
}

export interface Equipment extends EquipmentResponseDto {
    images: EquipmentImage[];
}

export interface CreateEquipmentDto {
    name: string;
    description: string;
    category: string;
    condition: string;
    isAvailable: boolean;
    locationId: string;
    images?: EquipmentImage[];
}

export interface UpdateEquipmentDto extends CreateEquipmentDto {
    status?: string;
} 