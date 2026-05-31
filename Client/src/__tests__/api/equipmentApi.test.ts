import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as equipmentApi from '@/src/api/equipmentApi';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const TOKEN = 'test-bearer-token';

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  await AsyncStorage.setItem('firebaseToken', TOKEN);
  jest.clearAllMocks();
});

describe('getAll', () => {
  it('makes a GET with no params when no filters provided', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    await equipmentApi.getAll();
    const [, config] = mockedAxios.get.mock.calls[0];
    expect(config!.params).toEqual({});
    expect(config!.headers!.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('serialises all filter fields as strings in params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    await equipmentApi.getAll({
      search: 'drill',
      categoryId: 3,
      isAvailable: true,
      startDate: '2026-06-01',
      endDate: '2026-06-07',
    });
    const [, config] = mockedAxios.get.mock.calls[0];
    expect(config!.params).toEqual({
      search: 'drill',
      categoryId: '3',
      isAvailable: 'true',
      startDate: '2026-06-01',
      endDate: '2026-06-07',
    });
  });

  it('omits keys for undefined filter values', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    await equipmentApi.getAll({ search: 'bike' });
    const [, config] = mockedAxios.get.mock.calls[0];
    expect(config!.params).toEqual({ search: 'bike' });
    expect(Object.keys(config!.params)).not.toContain('categoryId');
  });
});

describe('getById', () => {
  it('calls the correct URL and returns response data', async () => {
    const mockEquipment = { id: 'eq-1', name: 'Test Item' };
    mockedAxios.get.mockResolvedValueOnce({ data: mockEquipment });
    const result = await equipmentApi.getById('eq-1');
    const [url] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/equipment/eq-1');
    expect(result).toEqual(mockEquipment);
  });
});

describe('create', () => {
  it('sends a POST request with the dto payload', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { id: 'new-eq' } });
    const dto = { name: 'New Bike', description: 'A bike', categoryId: 1 } as any;
    await equipmentApi.create(dto);
    const [url, body] = mockedAxios.post.mock.calls[0];
    expect(url).toContain('/equipment');
    expect(body).toEqual(dto);
  });
});

describe('remove', () => {
  it('sends a DELETE to the correct URL', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: undefined });
    await equipmentApi.remove('eq-99');
    const [url] = mockedAxios.delete.mock.calls[0];
    expect(url).toContain('/equipment/eq-99');
  });
});
