import { Location } from '../types/Location';
import { getAuthToken } from '../utils/authUtils';
import { LOCATION_ENDPOINT } from '../utils/envConfig';
import axios from 'axios';

const BASE_URL = `${LOCATION_ENDPOINT}`;

export const createLocation = async (location: Location): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.post(BASE_URL, location, {
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

export const updateLocation = async (id: number, location: Location): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.patch(`${BASE_URL}/${id}`, location, {
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

export const getLocation = async (id: number): Promise<Location> => {
    const token = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/${id}`, {
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
    const response = await axios.get(BASE_URL, {
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
    const response = await axios.delete(`${BASE_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to delete location');
    }
}; 