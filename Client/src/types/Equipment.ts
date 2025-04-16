export interface Equipment {
    id?: string;
    name: string;
    description: string;
    category: string;
    condition: 'New' | 'Good' | 'Fair' | 'Poor';
    dailyRate: number;
    weeklyRate: number;
    imageUrls: string[];
    ownerId: string;
    locationId: string;
    status: 'Available' | 'Rented' | 'Maintenance' | 'Unavailable';
    createdAt?: Date;
    updatedAt?: Date;
} 