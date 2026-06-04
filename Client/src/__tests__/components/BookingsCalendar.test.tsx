import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));
jest.mock('react-native-calendars', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    Calendar: ({ markedDates, onDayPress, firstDay }: any) =>
      React.createElement(View, { testID: 'calendar-mock' },
        React.createElement(Text, { testID: 'first-day' }, String(firstDay)),
        React.createElement(Text, { testID: 'marked-count' }, String(Object.keys(markedDates || {}).length))
      ),
    LocaleConfig: {
      locales: {} as Record<string, any>,
      defaultLocale: 'en',
    },
  };
});
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { SettingsProvider } from '@/src/context/SettingsContext';
import BookingsCalendar from '@/src/components/BookingsCalendar';
import { BookingStatus } from '@/src/types/Booking';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      <SettingsProvider>
        <PaperProvider>{children}</PaperProvider>
      </SettingsProvider>
    </ThemeProvider>
  </AuthProvider>
);

const makeBooking = (id: string, status: BookingStatus, start: string, end: string) => ({
  id,
  equipmentId: 'eq-1',
  userId: 'u-1',
  startDateTime: start,
  endDateTime: end,
  status,
  createdAt: '2026-01-01',
});

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('BookingsCalendar', () => {
  it('renders without crashing with empty bookings', () => {
    expect(() =>
      render(<BookingsCalendar bookings={[]} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders the calendar component', () => {
    const { getByTestId } = render(<BookingsCalendar bookings={[]} />, { wrapper: Wrapper });
    expect(getByTestId('calendar-mock')).toBeTruthy();
  });

  it('renders legend status labels via i18n keys', () => {
    const { getByText } = render(<BookingsCalendar bookings={[]} />, { wrapper: Wrapper });
    expect(getByText('booking.calendar.legend.pending')).toBeTruthy();
    expect(getByText('booking.calendar.legend.approved')).toBeTruthy();
  });

  it('marks dates for a pending booking', () => {
    const bookings = [makeBooking('b1', BookingStatus.Pending, '2026-07-01T12:00:00', '2026-07-03T12:00:00')];
    const { getByTestId } = render(<BookingsCalendar bookings={bookings} />, { wrapper: Wrapper });
    const markedCount = parseInt(getByTestId('marked-count').props.children, 10);
    expect(markedCount).toBeGreaterThan(0);
  });

  it('filters out Returned/ReturnedEarly/Picked bookings from calendar', () => {
    const returned = makeBooking('b2', BookingStatus.Returned, '2026-07-10T12:00:00', '2026-07-12T12:00:00');
    const picked = makeBooking('b3', BookingStatus.Picked, '2026-07-10T12:00:00', '2026-07-12T12:00:00');
    const { getByTestId } = render(
      <BookingsCalendar bookings={[returned, picked]} />,
      { wrapper: Wrapper }
    );
    expect(getByTestId('marked-count').props.children).toBe('0');
  });

  it('renders with an approved booking (should be visible in calendar)', () => {
    const bookings = [makeBooking('b4', BookingStatus.Approved, '2026-07-05T12:00:00', '2026-07-07T12:00:00')];
    const { getByTestId } = render(<BookingsCalendar bookings={bookings} />, { wrapper: Wrapper });
    const markedCount = parseInt(getByTestId('marked-count').props.children, 10);
    expect(markedCount).toBeGreaterThan(0);
  });

  it('passes onDayPress prop through', () => {
    const onDayPress = jest.fn();
    expect(() =>
      render(<BookingsCalendar bookings={[]} onDayPress={onDayPress} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders multiple booking status types', () => {
    const bookings = [
      makeBooking('b5', BookingStatus.Pending, '2026-08-01T12:00:00', '2026-08-02T12:00:00'),
      makeBooking('b6', BookingStatus.Rejected, '2026-08-05T12:00:00', '2026-08-06T12:00:00'),
      makeBooking('b7', BookingStatus.Cancelled, '2026-08-10T12:00:00', '2026-08-11T12:00:00'),
    ];
    expect(() =>
      render(<BookingsCalendar bookings={bookings} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('marks ReturnRequested booking dates in calendar', () => {
    const bookings = [makeBooking('b8', BookingStatus.ReturnRequested, '2026-09-01T12:00:00', '2026-09-03T12:00:00')];
    const { getByTestId } = render(<BookingsCalendar bookings={bookings} />, { wrapper: Wrapper });
    const markedCount = parseInt(getByTestId('marked-count').props.children, 10);
    expect(markedCount).toBeGreaterThan(0);
  });

  it('marks ReturnEarlyRequested booking dates in calendar', () => {
    const bookings = [makeBooking('b9', BookingStatus.ReturnEarlyRequested, '2026-09-05T12:00:00', '2026-09-07T12:00:00')];
    const { getByTestId } = render(<BookingsCalendar bookings={bookings} />, { wrapper: Wrapper });
    const markedCount = parseInt(getByTestId('marked-count').props.children, 10);
    expect(markedCount).toBeGreaterThan(0);
  });

  it('marks Planning booking dates in calendar', () => {
    const bookings = [makeBooking('b10', BookingStatus.Planning, '2026-10-01T12:00:00', '2026-10-02T12:00:00')];
    const { getByTestId } = render(<BookingsCalendar bookings={bookings} />, { wrapper: Wrapper });
    const markedCount = parseInt(getByTestId('marked-count').props.children, 10);
    expect(markedCount).toBeGreaterThan(0);
  });

  it('renders booking spanning multiple months correctly', () => {
    const bookings = [makeBooking('b11', BookingStatus.Approved, '2026-07-28T12:00:00', '2026-08-02T12:00:00')];
    const { getByTestId } = render(<BookingsCalendar bookings={bookings} />, { wrapper: Wrapper });
    const markedCount = parseInt(getByTestId('marked-count').props.children, 10);
    expect(markedCount).toBeGreaterThan(0);
  });
});
