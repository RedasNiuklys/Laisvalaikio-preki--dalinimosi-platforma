import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/bookingApi', () => ({
  approveReturnRequest: jest.fn(() => new Promise(() => {})),
  rejectReturnRequest: jest.fn(() => new Promise(() => {})),
  submitBookingReturnRequest: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/userApi', () => ({
  getUsers: jest.fn(() => new Promise(() => {})),
  getUserById: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/components/BookingCard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockBookingCard({ booking }: any) {
    return React.createElement(View, { testID: `booking-card-${booking.id}` },
      React.createElement(Text, null, booking.id)
    );
  };
});
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import BookingsListModal from '@/src/components/BookingsListModal';
import { BookingStatus } from '@/src/types/Booking';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

const makeBooking = (id: string, status: BookingStatus = BookingStatus.Pending, endFuture = true) => ({
  id,
  equipmentId: 'eq-1',
  userId: 'u-1',
  startDateTime: '2026-07-01T12:00:00',
  endDateTime: endFuture ? '2099-07-10T12:00:00' : '2020-01-01T12:00:00',
  status,
  createdAt: '2026-01-01',
});

const baseProps = {
  visible: true,
  onDismiss: jest.fn(),
  bookings: [makeBooking('b1'), makeBooking('b2', BookingStatus.Approved)],
  equipmentName: 'Test Drill',
  equipmentOwnerId: 'owner-1',
};

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

describe('BookingsListModal', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<BookingsListModal {...baseProps} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders the equipment name in the title', () => {
    const { getByText } = render(<BookingsListModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('Test Drill')).toBeTruthy();
  });

  it('renders close/dismiss button', () => {
    const { getAllByRole } = render(<BookingsListModal {...baseProps} />, { wrapper: Wrapper });
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onDismiss when back icon is pressed', () => {
    const onDismiss = jest.fn();
    const { getAllByRole } = render(
      <BookingsListModal {...baseProps} onDismiss={onDismiss} />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getAllByRole('button')[0]);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders without crashing when visible=false', () => {
    expect(() =>
      render(<BookingsListModal {...baseProps} visible={false} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with empty bookings list', () => {
    expect(() =>
      render(<BookingsListModal {...baseProps} bookings={[]} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with onStatusChange and onRefresh callbacks', () => {
    const onStatusChange = jest.fn();
    const onRefresh = jest.fn();
    expect(() =>
      render(
        <BookingsListModal
          {...baseProps}
          onStatusChange={onStatusChange}
          onRefresh={onRefresh}
        />,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });
});
