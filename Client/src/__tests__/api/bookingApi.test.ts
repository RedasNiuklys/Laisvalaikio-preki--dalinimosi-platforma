import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bookingApi from '@/src/api/bookingApi';
import { BookingStatus, BookingStatusNumeric } from '@/src/types/Booking';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('expo-web-browser', () => ({ coolDownAsync: jest.fn() }));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const TOKEN = 'booking-test-token';

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  await AsyncStorage.setItem('firebaseToken', TOKEN);
  jest.clearAllMocks();
});

describe('getUserBookings', () => {
  it('maps numeric status fields to BookingStatus enum strings', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          id: 'b1',
          status: BookingStatusNumeric.Approved,
          startDateTime: '2026-06-01',
          endDateTime: '2026-06-07',
        },
      ],
    });
    const bookings = await bookingApi.getUserBookings();
    expect(bookings[0].status).toBe(BookingStatus.Approved);
  });

  it('sends the Bearer token in the request', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    await bookingApi.getUserBookings();
    const [, config] = mockedAxios.get.mock.calls[0];
    expect(config!.headers!.Authorization).toBe(`Bearer ${TOKEN}`);
  });
});

describe('createBooking', () => {
  it('POSTs the booking payload and converts response status', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 'b2', status: BookingStatusNumeric.Pending, startDateTime: '2026-07-01', endDateTime: '2026-07-05' },
    });
    const dto = { equipmentId: 'eq-1', startDateTime: '2026-07-01T00:00:00Z', endDateTime: '2026-07-05T00:00:00Z' };
    const result = await bookingApi.createBooking(dto);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/booking'),
      dto,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) })
    );
    expect(result.status).toBe(BookingStatus.Pending);
  });
});

describe('checkAvailability', () => {
  it('includes equipmentId and date strings as query params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: true });
    const result = await bookingApi.checkAvailability('eq-1', '2026-06-01', '2026-06-07');
    const [url, config] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('check-availability');
    expect(config!.params).toEqual({
      equipmentId: 'eq-1',
      startDate: '2026-06-01',
      endDate: '2026-06-07',
    });
    expect(result).toBe(true);
  });
});

describe('deleteBooking', () => {
  it('sends DELETE to the correct URL', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: undefined });
    await bookingApi.deleteBooking('b-42');
    const [url] = mockedAxios.delete.mock.calls[0];
    expect(url).toContain('/booking/b-42');
  });
});
