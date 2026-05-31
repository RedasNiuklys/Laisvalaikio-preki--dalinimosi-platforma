import {
  bookingStatusToNumeric,
  numericToBookingStatus,
  BookingStatus,
  BookingStatusNumeric,
} from '@/src/types/Booking';

describe('bookingStatusToNumeric', () => {
  it('maps Pending to 0', () => {
    expect(bookingStatusToNumeric(BookingStatus.Pending)).toBe(BookingStatusNumeric.Pending);
  });

  it('maps Approved to 2', () => {
    expect(bookingStatusToNumeric(BookingStatus.Approved)).toBe(BookingStatusNumeric.Approved);
  });

  it('maps every BookingStatus value to a number', () => {
    Object.values(BookingStatus).forEach((status) => {
      const result = bookingStatusToNumeric(status as BookingStatus);
      expect(typeof result).toBe('number');
    });
  });
});

describe('numericToBookingStatus', () => {
  it('maps 0 to Pending', () => {
    expect(numericToBookingStatus(BookingStatusNumeric.Pending)).toBe(BookingStatus.Pending);
  });

  it('maps 2 to Approved', () => {
    expect(numericToBookingStatus(BookingStatusNumeric.Approved)).toBe(BookingStatus.Approved);
  });

  it('round-trips every status value', () => {
    Object.values(BookingStatus).forEach((status) => {
      const numeric = bookingStatusToNumeric(status as BookingStatus);
      const roundTripped = numericToBookingStatus(numeric);
      expect(roundTripped).toBe(status);
    });
  });
});
