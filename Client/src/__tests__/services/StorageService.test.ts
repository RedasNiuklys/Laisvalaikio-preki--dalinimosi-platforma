import axios from 'axios';

jest.mock('axios');
jest.mock('@/src/utils/authUtils', () => ({
  getAuthToken: jest.fn().mockResolvedValue('test-token'),
}));

import { LocalFileStorageService, CloudStorageService } from '@/src/services/storage/StorageService';
import { getAuthToken } from '@/src/utils/authUtils';

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LocalFileStorageService', () => {
  const service = new LocalFileStorageService('http://localhost');

  it('uploadImage posts FormData to /Storage/UploadAvatar and returns avatarUrl', async () => {
    mockedAxios.post = jest.fn().mockResolvedValueOnce({ data: { avatarUrl: 'uploads/avatars/user-1.jpg' } });
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await service.uploadImage(file, 'user-1');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost/Storage/UploadAvatar',
      expect.any(FormData),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
    expect(result).toBe('uploads/avatars/user-1.jpg');
  });

  it('getImageUrl constructs correct URL', () => {
    const url = service.getImageUrl('uploads/avatars/img.png');
    expect(url).toBe('http://localhost/uploads/avatars/img.png');
  });

  it('deleteImage calls DELETE on /Storage/DeleteAvatar/:path', async () => {
    mockedAxios.delete = jest.fn().mockResolvedValueOnce({});

    await service.deleteImage('avatars/img.png');

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost/Storage/DeleteAvatar/avatars/img.png',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
  });

  it('uploadImage uses auth token from getAuthToken', async () => {
    mockedAxios.post = jest.fn().mockResolvedValueOnce({ data: { avatarUrl: 'url' } });
    const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });

    await service.uploadImage(file, 'u1');

    expect(getAuthToken).toHaveBeenCalled();
  });
});

describe('CloudStorageService', () => {
  const service = new CloudStorageService('http://localhost', 'aws');

  it('uploadImage posts to /Storage/UploadToCloud and returns avatarUrl', async () => {
    mockedAxios.post = jest.fn().mockResolvedValueOnce({ data: { avatarUrl: 'https://s3.example.com/img.jpg' } });
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await service.uploadImage(file, 'user-1');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost/Storage/UploadToCloud',
      expect.any(FormData),
      expect.anything()
    );
    expect(result).toBe('https://s3.example.com/img.jpg');
  });

  it('getImageUrl constructs cloud URL', () => {
    const url = service.getImageUrl('img.png');
    expect(url).toBe('http://localhost/Storage/GetFromCloud/img.png');
  });

  it('deleteImage calls DELETE on /Storage/DeleteFromCloud/:path', async () => {
    mockedAxios.delete = jest.fn().mockResolvedValueOnce({});

    await service.deleteImage('img.png');

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost/Storage/DeleteFromCloud/img.png',
      expect.anything()
    );
  });
});
