import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/envConfig', () => ({
  USER_ENDPOINT: 'http://test/api/user',
  BASE_URL: 'http://test/api',
}));

import axios from 'axios';
import * as userApi from '@/src/api/userApi';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const fakeUser = { id: 'u-1', email: 'a@b.com', firstName: 'Ada', lastName: 'Smith' };

beforeEach(async () => {
  await (AsyncStorage as any).setItem('firebaseToken', 'tok');
  jest.clearAllMocks();
});

describe('getUsers', () => {
  it('GETs all users with Bearer token', async () => {
    mockedAxios.get.mockResolvedValue({ data: [fakeUser] });
    const result = await userApi.getUsers();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/user',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    );
    expect(result).toEqual([fakeUser]);
  });

  it('throws when axios throws', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network'));
    await expect(userApi.getUsers()).rejects.toThrow('network');
  });
});

describe('getUserById', () => {
  it('GETs user by id', async () => {
    mockedAxios.get.mockResolvedValue({ data: fakeUser });
    const result = await userApi.getUserById('u-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/user/u-1',
      expect.anything()
    );
    expect(result).toEqual(fakeUser);
  });

  it('throws on error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('not found'));
    await expect(userApi.getUserById('bad')).rejects.toThrow('not found');
  });
});

describe('createUser', () => {
  it('POSTs user data', async () => {
    mockedAxios.post.mockResolvedValue({ data: fakeUser });
    const result = await userApi.createUser(fakeUser as any);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/user',
      fakeUser,
      expect.anything()
    );
    expect(result).toEqual(fakeUser);
  });
});

describe('updateUser', () => {
  it('PUTs updated user data', async () => {
    mockedAxios.put.mockResolvedValue({ data: { ...fakeUser, firstName: 'Bob' } });
    const result = await userApi.updateUser('u-1', { firstName: 'Bob' } as any);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://test/api/user/u-1',
      { firstName: 'Bob' },
      expect.anything()
    );
    expect(result.firstName).toBe('Bob');
  });
});

describe('updateUserThemePreference', () => {
  it('PATCHes theme preference', async () => {
    mockedAxios.patch.mockResolvedValue({ data: { themePreference: 'dark' } });
    const result = await userApi.updateUserThemePreference('dark');
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://test/api/user/theme-preference',
      { themePreference: 'dark' },
      expect.anything()
    );
    expect(result.themePreference).toBe('dark');
  });
});

describe('deleteUser', () => {
  it('DELETEs the user', async () => {
    mockedAxios.delete.mockResolvedValue({ data: 'deleted' });
    const result = await userApi.deleteUser(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://test/api/user/1',
      expect.anything()
    );
    expect(result).toBe('deleted');
  });
});

describe('getProfile', () => {
  it('GETs the profile endpoint', async () => {
    mockedAxios.get.mockResolvedValue({ data: fakeUser });
    const result = await userApi.getProfile();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/user/profile',
      expect.anything()
    );
    expect(result).toEqual(fakeUser);
  });
});
