import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bookingApi from '@/src/api/bookingApi';
import { BookingStatus, BookingStatusNumeric } from '@/src/types/Booking';

jest.mock('axios');
jest.mock('@/src/utils/firebaseConfig');
jest.mock('expo-web-browser', () => ({ coolDownAsync: jest.fn() }));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const TOKEN = 'booking-extended-token';

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  await AsyncStorage.setItem('firebaseToken', TOKEN);
  jest.clearAllMocks();
});

describe('getBookingsForEquipment', () => {
  it('GETs equipment bookings and converts status', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 'b1', status: BookingStatusNumeric.Pending, startDateTime: '2026-07-01', endDateTime: '2026-07-05' }],
    });
    const result = await bookingApi.getBookingsForEquipment('eq-1');
    const [url] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('equipment/eq-1');
    expect(result[0].status).toBe(BookingStatus.Pending);
  });
});

describe('updateBookingStatus', () => {
  it('PATCHes status to the correct endpoint', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: undefined });
    await bookingApi.updateBookingStatus('b-10', BookingStatus.Approved);
    const [url] = mockedAxios.patch.mock.calls[0];
    expect(url).toContain('/b-10/status');
  });
});

describe('approveReturnRequest', () => {
  it('PATCHes return-request/approve and returns booking', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: 'b-20', status: BookingStatusNumeric.Returned, startDateTime: '2026-07-01', endDateTime: '2026-07-10' },
    });
    const result = await bookingApi.approveReturnRequest('b-20');
    const [url] = mockedAxios.patch.mock.calls[0];
    expect(url).toContain('/b-20/return-request/approve');
    expect(result.status).toBe(BookingStatus.Returned);
  });
});

describe('rejectReturnRequest', () => {
  it('PATCHes return-request/reject and returns booking', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: 'b-21', status: BookingStatusNumeric.Approved, startDateTime: '2026-07-01', endDateTime: '2026-07-10' },
    });
    const result = await bookingApi.rejectReturnRequest('b-21');
    const [url] = mockedAxios.patch.mock.calls[0];
    expect(url).toContain('/b-21/return-request/reject');
    expect(result.status).toBe(BookingStatus.Approved);
  });
});

describe('submitBookingReturnRequest', () => {
  it('POSTs FormData to return-request endpoint', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 'b-30', status: BookingStatusNumeric.ReturnRequested, startDateTime: '2026-07-01', endDateTime: '2026-07-10' },
    });
    const result = await bookingApi.submitBookingReturnRequest('b-30', {
      isEarlyReturn: false,
    });
    const [url, body] = mockedAxios.post.mock.calls[0];
    expect(url).toContain('/b-30/return-request');
    expect(body).toBeInstanceOf(FormData);
    expect(result.status).toBe(BookingStatus.ReturnRequested);
  });

  it('includes requestedEndDateTime when isEarlyReturn=true', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 'b-31', status: BookingStatusNumeric.ReturnEarlyRequested, startDateTime: '2026-07-01', endDateTime: '2026-07-10' },
    });
    await bookingApi.submitBookingReturnRequest('b-31', {
      isEarlyReturn: true,
      requestedEndDateTime: '2026-07-05T12:00:00Z',
    });
    expect(mockedAxios.post).toHaveBeenCalled();
  });
});

describe('markBookingPicked', () => {
  it('calls updateBookingStatus with Picked', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: undefined });
    await bookingApi.markBookingPicked('b-40');
    const [url, body] = mockedAxios.patch.mock.calls[0];
    expect(url).toContain('/b-40/status');
  });
});
