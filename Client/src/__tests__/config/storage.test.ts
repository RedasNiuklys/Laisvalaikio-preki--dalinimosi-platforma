jest.mock('@/src/utils/envConfig', () => ({ BASE_URL: 'http://localhost:5000' }));
jest.mock('@/src/services/storage/StorageService', () => ({
  LocalFileStorageService: jest.fn().mockImplementation(() => ({
    uploadImage: jest.fn(),
    getImageUrl: jest.fn(() => 'http://localhost:5000/path'),
    deleteImage: jest.fn(),
  })),
  DatabaseStorageService: jest.fn().mockImplementation(() => ({
    uploadImage: jest.fn(),
    getImageUrl: jest.fn(() => 'http://localhost:5000/db/path'),
    deleteImage: jest.fn(),
  })),
  CloudStorageService: jest.fn().mockImplementation(() => ({
    uploadImage: jest.fn(),
    getImageUrl: jest.fn(() => 'https://cloud/path'),
    deleteImage: jest.fn(),
  })),
}));

import { createStorageService, switchStorageType, StorageType } from '@/src/config/storage';
import {
  LocalFileStorageService,
  DatabaseStorageService,
  CloudStorageService,
} from '@/src/services/storage/StorageService';

beforeEach(() => {
  (LocalFileStorageService as jest.Mock).mockClear();
  (DatabaseStorageService as jest.Mock).mockClear();
  (CloudStorageService as jest.Mock).mockClear();
});

describe('StorageType enum', () => {
  it('has LocalFile, Database, Cloud variants', () => {
    expect(StorageType.LocalFile).toBe('local');
    expect(StorageType.Database).toBe('database');
    expect(StorageType.Cloud).toBe('cloud');
  });
});

describe('createStorageService', () => {
  it('creates LocalFileStorageService for LocalFile type', () => {
    const service = createStorageService({ type: StorageType.LocalFile, options: { storagePath: 'uploads/avatars' } });
    expect(LocalFileStorageService).toHaveBeenCalledWith('http://localhost:5000', 'uploads/avatars');
    expect(service).toBeDefined();
  });

  it('creates LocalFileStorageService without options (undefined storagePath)', () => {
    const service = createStorageService({ type: StorageType.LocalFile });
    expect(LocalFileStorageService).toHaveBeenCalledWith('http://localhost:5000', undefined);
    expect(service).toBeDefined();
  });

  it('creates DatabaseStorageService for Database type', () => {
    const service = createStorageService({ type: StorageType.Database });
    expect(DatabaseStorageService).toHaveBeenCalledWith('http://localhost:5000');
    expect(service).toBeDefined();
  });

  it('creates CloudStorageService for Cloud type', () => {
    const service = createStorageService({ type: StorageType.Cloud });
    expect(CloudStorageService).toHaveBeenCalledWith('http://localhost:5000', 'aws');
    expect(service).toBeDefined();
  });

  it('creates CloudStorageService with specified provider', () => {
    createStorageService({ type: StorageType.Cloud, options: { provider: 'azure' } });
    expect(CloudStorageService).toHaveBeenCalledWith('http://localhost:5000', 'azure');
  });

  it('throws for unsupported storage type', () => {
    expect(() => createStorageService({ type: 'unknown' as StorageType })).toThrow();
  });
});

describe('switchStorageType', () => {
  it('creates a new service of the requested type', () => {
    const service = switchStorageType(StorageType.Cloud, { provider: 'google' });
    expect(CloudStorageService).toHaveBeenCalled();
    expect(service).toBeDefined();
  });

  it('creates LocalFile service when switched to LocalFile', () => {
    const service = switchStorageType(StorageType.LocalFile);
    expect(LocalFileStorageService).toHaveBeenCalled();
    expect(service).toBeDefined();
  });
});
