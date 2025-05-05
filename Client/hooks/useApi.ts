import { useCallback } from 'react';
import { BASE_URL } from '@/src/utils/envConfig';
import axios from 'axios';

export const useApi = () => {
    const get = useCallback(async (endpoint: string) => {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }, []);

    const post = useCallback(async (endpoint: string, data: any) => {
        const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.data;
    }, []);

    return { get, post };
}; 