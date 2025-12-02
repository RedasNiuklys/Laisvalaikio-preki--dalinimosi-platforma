export interface EquipmentImage {
    id: string;
    equipmentId: string;
    url: string;
    isMain: boolean;
    createdAt: Date;
    updatedAt?: Date;
} 