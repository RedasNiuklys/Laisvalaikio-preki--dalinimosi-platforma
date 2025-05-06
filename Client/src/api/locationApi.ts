import { Location } from '../types/Location';
import { getAuthToken } from '../utils/authUtils';
import { LOCATION_ENDPOINT } from '../utils/envConfig';
import axios from 'axios';

export const createLocation = async (location: Location): Promise<Location> => {
    const token = await getAuthToken();
    //console.log
    (location);
    const response = await axios.post(LOCATION_ENDPOINT, location, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 201 && response.status !== 200) {
        throw new Error('Failed to create location');
    }

    return response.data;
};

export const updateLocation = async (id: string, location: Location): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.patch(`${LOCATION_ENDPOINT}/${id}`, location, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error('Failed to update location');
    }

    return response.data;
};

export const getLocation = async (id: string): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.get(`${LOCATION_ENDPOINT}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error('Failed to fetch location');
    }

    return response.data;
};

export const getLocations = async (): Promise<Location[]> => {
    const token = await getAuthToken();
    const response = await axios.get(LOCATION_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error('Failed to fetch locations');
    }

    return response.data;
};

export const deleteLocation = async (id: number): Promise<void> => {
    const token = await getAuthToken();
    const response = await axios.delete(`${LOCATION_ENDPOINT}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to delete location');
    }
};

export const getByOwner = async (ownerId: string): Promise<Location[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${LOCATION_ENDPOINT}/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getById = async (id: string): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.get(`${LOCATION_ENDPOINT}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const create = async (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.post(LOCATION_ENDPOINT, location, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const update = async (id: string, location: Partial<Location>): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.put(`${LOCATION_ENDPOINT}/${id}`, location, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const remove = async (id: string): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${LOCATION_ENDPOINT}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}; 