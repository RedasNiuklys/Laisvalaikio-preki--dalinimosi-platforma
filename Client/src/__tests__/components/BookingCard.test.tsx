import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import BookingCard from '@/src/components/BookingCard';
import { BookingStatus } from '@/src/types/Booking';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

const baseBooking = {
  id: 'b1',
  equipmentId: 'eq-1',
  userId: 'u1',
  startDateTime: '2026-06-01T00:00:00.000Z',
  endDateTime: '2026-06-07T00:00:00.000Z',
  status: BookingStatus.Pending,
  createdAt: '2026-05-01',
} as any;

describe('BookingCard', () => {
  it('renders the booking start date', () => {
    const { getByText } = render(<BookingCard booking={baseBooking} />, {
      wrapper: Wrapper,
    });
    expect(getByText(/2026-06-01/)).toBeTruthy();
  });

  it('renders the booking end date', () => {
    const { getByText } = render(<BookingCard booking={baseBooking} />, {
      wrapper: Wrapper,
    });
    expect(getByText(/2026-06-07/)).toBeTruthy();
  });

  it('renders the status label via i18n key', () => {
    const { getByText } = render(<BookingCard booking={baseBooking} />, {
      wrapper: Wrapper,
    });
    // Our i18n mock returns the key as-is: t('booking.status.pending') => 'booking.status.pending'
    expect(getByText('booking.status.pending')).toBeTruthy();
  });

  it('renders notes when provided', () => {
    const { getByText } = render(
      <BookingCard booking={{ ...baseBooking, notes: 'Please handle with care' }} />,
      { wrapper: Wrapper }
    );
    expect(getByText('Please handle with care')).toBeTruthy();
  });

  it('renders user name when user is attached', () => {
    const { getByText } = render(
      <BookingCard
        booking={{ ...baseBooking, user: { firstName: 'John', lastName: 'Doe' } }}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('John Doe')).toBeTruthy();
  });
});
