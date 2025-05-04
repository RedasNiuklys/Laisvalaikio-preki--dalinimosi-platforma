export type Location = {
    id?: string;
    name: string;
    description?: string;
    streetAddress: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    latitude: number;
    longitude: number;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export type LocationFormData = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>; 