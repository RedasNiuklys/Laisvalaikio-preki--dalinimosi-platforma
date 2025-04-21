export type Location = {
    id?: number;
    name: string;
    description?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    userId?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface LocationFormData {
    name: string;
    description?: string;
    streetAddress: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    latitude?: number | null;
    longitude?: number | null;
} 