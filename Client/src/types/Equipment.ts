import { Booking } from './Booking';
import { Category } from './Category';
import { Location } from './Location';
import { EquipmentImage } from './EquipmentImage';

export type EquipmentCondition = 'Good' | 'Fair' | 'Poor' | 'Needs Repair';

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

export interface Equipment {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    category: Category;
    categoryId: number;
    tags: string[];
    condition: string;
    IsAvailable: boolean;
    locationId: string;
    location: Location;
    createdAt: string;
    updatedAt?: string;
    bookings: Booking[];
    maintenanceHistory: MaintenanceRecord[];
    images: EquipmentImage[];
}

// export interface Category {
//     id: number;
//     name: string;
//     iconName: string;
//     parentCategoryId?: number;
//     createdAt: Date;
//     updatedAt: Date;
// }

export interface CreateEquipmentDto {
    name: string;
    description: string;
    category: Category;
    condition: string;
    locationId: string;
    images?: EquipmentImage[];
}

export interface UpdateEquipmentDto extends CreateEquipmentDto {
    IsAvailable?: boolean;
} 