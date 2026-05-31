import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as equipmentApi from '@/src/api/equipmentApi';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const TOKEN = 'equipment-extended-token';

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  await AsyncStorage.setItem('firebaseToken', TOKEN);
  jest.clearAllMocks();
});

describe('update', () => {
  it('sends PUT to correct URL with dto', async () => {
    mockedAxios.put = jest.fn().mockResolvedValueOnce({ data: undefined });
    const dto = { name: 'Updated Bike', description: 'Updated desc' } as any;
    await equipmentApi.update('eq-1', dto);
    const [url, body] = mockedAxios.put.mock.calls[0];
    expect(url).toContain('/equipment/eq-1');
    expect(body).toEqual(dto);
  });
});

describe('getByOwner', () => {
  it('GETs equipment by owner userId', async () => {
    const mockData = [{ id: 'eq-1', name: 'Bike', ownerId: 'u-1' }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });
    const result = await equipmentApi.getByOwner('u-1');
    const [url] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/owner/u-1');
    expect(result).toEqual(mockData);
  });
});

describe('getByCategory', () => {
  it('GETs equipment by category slug', async () => {
    const mockData = [{ id: 'eq-2', name: 'Tent', category: { slug: 'camping' } }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });
    const result = await equipmentApi.getByCategory('camping');
    const [url] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/category/camping');
    expect(result).toEqual(mockData);
  });
});

describe('deleteImage', () => {
  it('sends DELETE to correct image URL', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: undefined });
    await equipmentApi.deleteImage('eq-1', 'http://example.com/img.jpg');
    const [url] = mockedAxios.delete.mock.calls[0];
    expect(url).toContain('/equipment/eq-1/images');
  });
});

describe('error handling', () => {
  it('getByOwner re-throws on network error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    await expect(equipmentApi.getByOwner('u-bad')).rejects.toThrow('network error');
  });

  it('update re-throws on server error', async () => {
    mockedAxios.put = jest.fn().mockRejectedValueOnce(new Error('server error'));
    await expect(equipmentApi.update('eq-bad', {} as any)).rejects.toThrow('server error');
  });
});
