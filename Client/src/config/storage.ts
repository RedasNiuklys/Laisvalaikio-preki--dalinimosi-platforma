import {
    StorageService,
    LocalFileStorageService,
    DatabaseStorageService,
    CloudStorageService
} from '../services/storage/StorageService';
import { BASE_URL } from '../utils/envConfig';

// Storage type enum
export enum StorageType {
    LocalFile = 'local',
    Database = 'database',
    Cloud = 'cloud'
}

// Storage configuration
interface StorageConfig {
    type: StorageType;
    options?: {
        storagePath?: string;
        provider?: 'aws' | 'azure' | 'google';
    };
}

// Current storage configuration
const currentConfig: StorageConfig = {
    type: StorageType.LocalFile,
    options: {
        storagePath: 'uploads/avatars'
    }
};

// Create storage service based on configuration
export const createStorageService = (config: StorageConfig): StorageService => {
    switch (config.type) {
        case StorageType.LocalFile:
            return new LocalFileStorageService(
                BASE_URL,
                config.options?.storagePath
            );

        case StorageType.Database:
            return new DatabaseStorageService(BASE_URL);

        case StorageType.Cloud:
            return new CloudStorageService(
                BASE_URL,
                config.options?.provider || 'aws'
            );

        default:
            throw new Error(`Unsupported storage type: ${config.type}`);
    }
};

// Export the configured storage service
export const storageService: StorageService = createStorageService(currentConfig);

// Helper function to switch storage type
export const switchStorageType = (type: StorageType, options?: any): StorageService => {
    const newConfig: StorageConfig = {
        type,
        options
    };

    return createStorageService(newConfig);
};

// In the future, we can switch to cloud storage by uncommenting and modifying this:
/*
import { CloudStorageService } from '../services/storage/StorageService';

export const storageService: StorageService = new CloudStorageService(API_URL);
*/ 