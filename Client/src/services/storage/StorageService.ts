import axios from 'axios';
import { getAuthToken } from '../../utils/authUtils';

export interface StorageService {
    uploadImage(file: File, userId: string): Promise<string>;
    getImageUrl(path: string): string;
    deleteImage(path: string): Promise<void>;
}

// Local file system implementation
export class LocalFileStorageService implements StorageService {
    private baseUrl: string;
    private storagePath: string;

    constructor(baseUrl: string, storagePath: string = 'uploads/avatars') {
        this.baseUrl = baseUrl;
        this.storagePath = storagePath;
    }

    async uploadImage(file: File, userId: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        const token = await getAuthToken();
        const response = await axios.post(`${this.baseUrl}/Storage/UploadAvatar`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data.avatarUrl;
    }

    getImageUrl(path: string): string {
        return `${this.baseUrl}/${path}`;
    }

    async deleteImage(path: string): Promise<void> {
        const token = await getAuthToken();
        await axios.delete(`${this.baseUrl}/Storage/DeleteAvatar/${path}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
}


// Cloud storage implementation (for future use)
export class CloudStorageService implements StorageService {
    private baseUrl: string;
    private provider: 'aws' | 'azure' | 'google';

    constructor(baseUrl: string, provider: 'aws' | 'azure' | 'google') {
        this.baseUrl = baseUrl;
        this.provider = provider;
    }

    async uploadImage(file: File, userId: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('provider', this.provider);

        const token = await getAuthToken();
        const response = await axios.post(`${this.baseUrl}/Storage/UploadToCloud`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data.avatarUrl;
    }

    getImageUrl(path: string): string {
        return `${this.baseUrl}/Storage/GetFromCloud/${path}`;
    }

    async deleteImage(path: string): Promise<void> {
        const token = await getAuthToken();
        await axios.delete(`${this.baseUrl}/Storage/DeleteFromCloud/${path}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
} 