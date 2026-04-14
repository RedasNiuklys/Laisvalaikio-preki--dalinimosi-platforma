export interface EquipmentImage {
    id: string;
    equipmentId: string;
    url: string;
    imageUrl?: string;
    isMain: boolean;
    isMainImage?: boolean;
    createdAt: Date;
    updatedAt?: Date;
} 