import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/envConfig', () => ({
  BASE_URL: 'http://test/api',
}));

import axios from 'axios';
import * as usedDatesApi from '@/src/api/usedDatesApi';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const fakeUsedDate = { id: 'ud-1', equipmentId: 'eq-1', startDate: '2026-06-01', endDate: '2026-06-07' };

beforeEach(async () => {
  await (AsyncStorage as any).setItem('firebaseToken', 'tok');
  jest.clearAllMocks();
});

describe('getUsedDatesForEquipment', () => {
  it('GETs dates for equipment and checks status', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: [fakeUsedDate] });
    const result = await usedDatesApi.getUsedDatesForEquipment('eq-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/useddates/equipment/eq-1',
      expect.anything()
    );
    expect(result).toEqual([fakeUsedDate]);
  });

  it('throws when status is not 200', async () => {
    mockedAxios.get.mockResolvedValue({ status: 500, data: null });
    await expect(usedDatesApi.getUsedDatesForEquipment('eq-1')).rejects.toThrow('Failed to fetch used dates');
  });
});

describe('getUsedDatesForUser', () => {
  it('GETs dates for user', async () => {
    mockedAxios.get.mockResolvedValue({ data: [fakeUsedDate] });
    const result = await usedDatesApi.getUsedDatesForUser('u-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/useddates/user/u-1',
      expect.anything()
    );
    expect(result).toEqual([fakeUsedDate]);
  });
});

describe('createUsedDates', () => {
  it('POSTs new used dates', async () => {
    mockedAxios.post.mockResolvedValue({ data: fakeUsedDate });
    const dto = { equipmentId: 'eq-1', startDate: '2026-06-01', endDate: '2026-06-07' };
    const result = await usedDatesApi.createUsedDates(dto as any);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/useddates',
      dto,
      expect.anything()
    );
    expect(result).toEqual(fakeUsedDate);
  });
});

describe('updateUsedDates', () => {
  it('PUTs updated used dates', async () => {
    mockedAxios.put.mockResolvedValue({ data: { ...fakeUsedDate, endDate: '2026-06-14' } });
    const result = await usedDatesApi.updateUsedDates('ud-1', { endDate: '2026-06-14' });
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://test/api/useddates/ud-1',
      { endDate: '2026-06-14' },
      expect.anything()
    );
    expect(result.endDate).toBe('2026-06-14');
  });
});

describe('deleteUsedDates', () => {
  it('DELETEs the used dates', async () => {
    mockedAxios.delete.mockResolvedValue({ data: undefined });
    await usedDatesApi.deleteUsedDates('ud-1');
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://test/api/useddates/ud-1',
      expect.anything()
    );
  });
});

describe('checkAvailability', () => {
  it('passes date params and returns available flag', async () => {
    mockedAxios.get.mockResolvedValue({ data: { available: true } });
    const start = new Date('2026-06-01');
    const end = new Date('2026-06-07');
    const result = await usedDatesApi.checkAvailability('eq-1', start, end);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/useddates/check-availability',
      expect.objectContaining({ params: expect.objectContaining({ equipmentId: 'eq-1' }) })
    );
    expect(result).toBe(true);
  });
});

describe('addUsedDate', () => {
  it('POSTs to equipment-specific endpoint', async () => {
    mockedAxios.post.mockResolvedValue({ data: fakeUsedDate });
    const dto = { equipmentId: 'eq-1', startDate: '2026-06-01', endDate: '2026-06-07' };
    const result = await usedDatesApi.addUsedDate('eq-1', dto as any);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/useddates/equipment/eq-1',
      dto,
      expect.anything()
    );
    expect(result).toEqual(fakeUsedDate);
  });
});
