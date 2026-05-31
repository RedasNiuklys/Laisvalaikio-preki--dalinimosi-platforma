import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/envConfig', () => ({
  CATEGORY_ENDPOINT: 'http://test/api/category',
  BASE_URL: 'http://test/api',
}));

import axios from 'axios';
import * as categoryApi from '@/src/api/categoryApi';

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(async () => {
  await (AsyncStorage as any).setItem('firebaseToken', 'test-token');
  jest.clearAllMocks();
});

describe('getCategories', () => {
  it('GETs the category endpoint with Bearer token', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: 1, name: 'Tools' }] });
    const result = await categoryApi.getCategories();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/category',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
    expect(result).toEqual([{ id: 1, name: 'Tools' }]);
  });
});

describe('getCategoryById', () => {
  it('GETs the correct URL', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 3, name: 'Summer' } });
    const result = await categoryApi.getCategoryById(3);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/category/3',
      expect.anything()
    );
    expect(result).toEqual({ id: 3, name: 'Summer' });
  });
});

describe('createCategory', () => {
  it('POSTs payload and returns created category', async () => {
    const dto = { name: 'Winter', slug: 'winter', iconName: 'snow', parentCategoryId: null };
    mockedAxios.post.mockResolvedValue({ data: { id: 10, ...dto } });
    const result = await categoryApi.createCategory(dto as any);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/category',
      dto,
      expect.anything()
    );
    expect(result.id).toBe(10);
  });
});

describe('updateCategory', () => {
  it('PUTs to correct URL with payload', async () => {
    mockedAxios.put.mockResolvedValue({ data: { id: 3, name: 'Updated' } });
    const result = await categoryApi.updateCategory(3, { name: 'Updated' });
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://test/api/category/3',
      { name: 'Updated' },
      expect.anything()
    );
    expect(result.name).toBe('Updated');
  });
});

describe('deleteCategory', () => {
  it('DELETEs the correct URL', async () => {
    mockedAxios.delete.mockResolvedValue({ data: undefined });
    await categoryApi.deleteCategory(5);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://test/api/category/5',
      expect.anything()
    );
  });
});

describe('getSubcategories', () => {
  it('GETs subcategories under parentId', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: 4, name: 'Skiing' }] });
    const result = await categoryApi.getSubcategories(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/category/1/subcategories',
      expect.anything()
    );
    expect(result).toHaveLength(1);
  });
});
