import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/utils/envConfig', () => ({
  BASE_URL: 'http://test/api',
}));

import axios from 'axios';
import * as reviewApi from '@/src/api/reviewApi';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const fakeReview = {
  id: 'rev-1',
  equipmentId: 'eq-1',
  bookingId: 'b-1',
  userId: 'u-1',
  rating: 4,
  comment: 'Great!',
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(async () => {
  await (AsyncStorage as any).setItem('firebaseToken', 'tok');
  jest.clearAllMocks();
});

describe('getReviewsForEquipment', () => {
  it('GETs reviews for equipment', async () => {
    mockedAxios.get.mockResolvedValue({ data: [fakeReview] });
    const result = await reviewApi.getReviewsForEquipment('eq-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/review/equipment/eq-1',
      expect.anything()
    );
    expect(result).toEqual([fakeReview]);
  });
});

describe('getReviewEligibility', () => {
  it('GETs eligibility for equipment', async () => {
    mockedAxios.get.mockResolvedValue({ data: { canReview: true, eligibleBookingId: 'b-1' } });
    const result = await reviewApi.getReviewEligibility('eq-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test/api/review/equipment/eq-1/eligibility',
      expect.anything()
    );
    expect(result.canReview).toBe(true);
  });
});

describe('createReview', () => {
  it('POSTs review DTO and returns created review', async () => {
    mockedAxios.post.mockResolvedValue({ data: fakeReview });
    const dto = { equipmentId: 'eq-1', bookingId: 'b-1', rating: 4, comment: 'Great!' };
    const result = await reviewApi.createReview(dto);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://test/api/review',
      dto,
      expect.anything()
    );
    expect(result.id).toBe('rev-1');
  });
});

describe('updateReview', () => {
  it('PUTs updated fields', async () => {
    mockedAxios.put.mockResolvedValue({ data: { ...fakeReview, rating: 5 } });
    const result = await reviewApi.updateReview('rev-1', { rating: 5 });
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://test/api/review/rev-1',
      { rating: 5 },
      expect.anything()
    );
    expect(result.rating).toBe(5);
  });
});

describe('deleteReview', () => {
  it('DELETEs the review', async () => {
    mockedAxios.delete.mockResolvedValue({ data: undefined });
    await reviewApi.deleteReview('rev-1');
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://test/api/review/rev-1',
      expect.anything()
    );
  });
});
