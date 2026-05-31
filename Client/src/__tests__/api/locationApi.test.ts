import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/envConfig', () => ({
  LOCATION_ENDPOINT: 'http://test/api/location',
  BASE_URL: 'http://test/api',
}));

import axios from 'axios';
import * as locationApi from '@/src/api/locationApi';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const fakeLocation = {
  id: 'loc-1',
  name: 'Home',
  streetAddress: '1 Main St',
  city: 'Vilnius',
  country: 'Lithuania',
  latitude: 54.6,
  longitude: 25.2,
};

beforeEach(async () => {
  await (AsyncStorage as any).setItem('firebaseToken', 'tok');
  jest.clearAllMocks();
});

describe('getLocations', () => {
  it('GETs all locations and returns data', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: [fakeLocation] });
    const result = await locationApi.getLocations();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/location',
      expect.anything()
    );
    expect(result).toEqual([fakeLocation]);
  });

  it('throws when status is not 200', async () => {
    mockedAxios.get.mockResolvedValue({ status: 500, data: null });
    await expect(locationApi.getLocations()).rejects.toThrow('Failed to fetch locations');
  });
});

describe('getLocation', () => {
  it('GETs location by id', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: fakeLocation });
    const result = await locationApi.getLocation('loc-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/location/loc-1',
      expect.anything()
    );
    expect(result.id).toBe('loc-1');
  });

  it('throws when status is not 200', async () => {
    mockedAxios.get.mockResolvedValue({ status: 404, data: null });
    await expect(locationApi.getLocation('bad')).rejects.toThrow('Failed to fetch location');
  });
});

describe('createLocation', () => {
  it('POSTs and returns created location', async () => {
    mockedAxios.post.mockResolvedValue({ status: 201, data: fakeLocation });
    const result = await locationApi.createLocation(fakeLocation as any);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/location',
      fakeLocation,
      expect.anything()
    );
    expect(result).toEqual(fakeLocation);
  });

  it('throws when status is not 200/201', async () => {
    mockedAxios.post.mockResolvedValue({ status: 400, data: null });
    await expect(locationApi.createLocation(fakeLocation as any)).rejects.toThrow('Failed to create location');
  });
});

describe('updateLocation', () => {
  it('PATCHes the location', async () => {
    mockedAxios.patch.mockResolvedValue({ status: 200, data: { ...fakeLocation, name: 'Office' } });
    const result = await locationApi.updateLocation('loc-1', { ...fakeLocation, name: 'Office' } as any);
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://test/api/location/loc-1',
      expect.anything(),
      expect.anything()
    );
    expect(result.name).toBe('Office');
  });
});

describe('deleteLocation', () => {
  it('DELETEs and resolves on 200', async () => {
    mockedAxios.delete.mockResolvedValue({ status: 200, data: undefined });
    await expect(locationApi.deleteLocation(1)).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://test/api/location/1',
      expect.anything()
    );
  });

  it('throws when status is not 200/204', async () => {
    mockedAxios.delete.mockResolvedValue({ status: 500, data: null });
    await expect(locationApi.deleteLocation(1)).rejects.toThrow('Failed to delete location');
  });
});

describe('getByOwner', () => {
  it('GETs locations for owner', async () => {
    mockedAxios.get.mockResolvedValue({ data: [fakeLocation] });
    const result = await locationApi.getByOwner('user-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/location/owner/user-1',
      expect.anything()
    );
    expect(result).toEqual([fakeLocation]);
  });
});

describe('getById', () => {
  it('GETs location by string id', async () => {
    mockedAxios.get.mockResolvedValue({ data: fakeLocation });
    const result = await locationApi.getById('loc-1');
    expect(result).toEqual(fakeLocation);
  });
});

describe('create', () => {
  it('POSTs via create()', async () => {
    mockedAxios.post.mockResolvedValue({ data: fakeLocation });
    const result = await locationApi.create({ name: 'Home' } as any);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/location',
      { name: 'Home' },
      expect.anything()
    );
    expect(result).toEqual(fakeLocation);
  });
});

describe('remove', () => {
  it('DELETEs via remove()', async () => {
    mockedAxios.delete.mockResolvedValue({ data: undefined });
    await locationApi.remove('loc-1');
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://test/api/location/loc-1',
      expect.anything()
    );
  });
});
