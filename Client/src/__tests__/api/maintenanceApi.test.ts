import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/envConfig', () => ({
  MAINTENANCE_ENDPOINT: 'http://test/api/maintenance',
  BASE_URL: 'http://test/api',
}));

import axios from 'axios';
import * as maintenanceApi from '@/src/api/maintenanceApi';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const fakeRecord: maintenanceApi.MaintenanceRecord = {
  id: 1,
  equipmentId: 'eq-1',
  title: 'Oil change',
  description: 'Changed oil',
  maintenanceDate: '2026-01-01',
  performedBy: 'Tech',
  notes: 'All good',
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(async () => {
  await (AsyncStorage as any).setItem('firebaseToken', 'tok');
  jest.clearAllMocks();
});

describe('getByEquipment', () => {
  it('GETs records for equipment', async () => {
    mockedAxios.get.mockResolvedValue({ data: [fakeRecord] });
    const result = await maintenanceApi.getByEquipment('eq-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/maintenance/equipment/eq-1',
      expect.anything()
    );
    expect(result).toEqual([fakeRecord]);
  });
});

describe('create', () => {
  it('POSTs a new maintenance record', async () => {
    mockedAxios.post.mockResolvedValue({ data: fakeRecord });
    const dto: maintenanceApi.CreateMaintenanceRecordDto = {
      equipmentId: 'eq-1',
      title: 'Oil change',
      description: 'Changed oil',
      maintenanceDate: '2026-01-01',
      performedBy: 'Tech',
    };
    const result = await maintenanceApi.create(dto);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/maintenance',
      dto,
      expect.anything()
    );
    expect(result.title).toBe('Oil change');
  });

  it('includes setUnavailable when provided', async () => {
    mockedAxios.post.mockResolvedValue({ data: fakeRecord });
    await maintenanceApi.create({
      equipmentId: 'eq-1', title: 'T', description: 'D',
      maintenanceDate: '2026-01-01', performedBy: 'P', setUnavailable: true,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ setUnavailable: true }),
      expect.anything()
    );
  });
});

describe('update', () => {
  it('PUTs updated fields', async () => {
    mockedAxios.put.mockResolvedValue({ data: { ...fakeRecord, title: 'Updated' } });
    const result = await maintenanceApi.update(1, { title: 'Updated' });
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://test/api/maintenance/1',
      { title: 'Updated' },
      expect.anything()
    );
    expect(result.title).toBe('Updated');
  });
});

describe('remove', () => {
  it('DELETEs the record', async () => {
    mockedAxios.delete.mockResolvedValue({ data: undefined });
    await maintenanceApi.remove(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://test/api/maintenance/1',
      expect.anything()
    );
  });
});
