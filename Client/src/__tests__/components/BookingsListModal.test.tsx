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
import * as AuthContextModule from '@/src/context/AuthContext';
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

  it('renders with initialBookingId filtering', () => {
    expect(() =>
      render(
        <BookingsListModal {...baseProps} initialBookingId="b1" />,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Helper to set up the owner user in AuthContext
// ---------------------------------------------------------------------------
const OWNER_ID = 'owner-1';
const ownerAuthValue = {
  user: { id: OWNER_ID, firstName: 'Owner', lastName: 'User', userName: 'owner', email: 'owner@test.com' },
  isAuthenticated: true,
  authProvider: '',
  token: 'tok',
  loadUser: jest.fn().mockResolvedValue(undefined),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
} as any;

const makeB = (id: string, status: BookingStatus, userId = 'user-1', opts: any = {}) => ({
  id,
  equipmentId: 'eq-1',
  userId,
  startDateTime: '2026-07-01T12:00:00',
  endDateTime: opts.pastEnd ? '2020-01-01T12:00:00' : '2099-07-10T12:00:00',
  status,
  createdAt: '2026-01-01',
  returnPhotoUrl: opts.returnPhotoUrl || null,
  ...opts,
});

describe('BookingsListModal — owner view (isOwner=true)', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    jest.useRealTimers();
    spy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue(ownerAuthValue);
  });

  afterEach(() => {
    spy.mockRestore();
    jest.useFakeTimers();
  });

  it('renders approve/reject actions for Pending booking when isOwner', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId={OWNER_ID}
        bookings={[makeB('b1', BookingStatus.Pending)]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.approve')).toBeTruthy();
    expect(getByText('booking.actions.reject')).toBeTruthy();
  });

  it('renders cancel action for Approved booking when isOwner', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId={OWNER_ID}
        bookings={[makeB('b1', BookingStatus.Approved)]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.cancel')).toBeTruthy();
  });

  it('renders approveReturn/rejectReturn for ReturnRequested booking when isOwner', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId={OWNER_ID}
        bookings={[makeB('b1', BookingStatus.ReturnRequested)]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.approveReturn')).toBeTruthy();
    expect(getByText('booking.actions.rejectReturn')).toBeTruthy();
  });

  it('renders approveReturn/rejectReturn for ReturnEarlyRequested booking when isOwner', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId={OWNER_ID}
        bookings={[makeB('b1', BookingStatus.ReturnEarlyRequested)]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.approveReturn')).toBeTruthy();
  });

  it('shows filter toggle button when isOwner', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId={OWNER_ID}
        bookings={[makeB('b1', BookingStatus.Pending)]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.filters.button')).toBeTruthy();
  });

  it('renders viewReturnPhoto action when booking has returnPhotoUrl', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId={OWNER_ID}
        bookings={[makeB('b1', BookingStatus.Returned, 'user-1', { returnPhotoUrl: 'http://test.com/photo.jpg' })]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.viewReturnPhoto')).toBeTruthy();
  });

  it('hides past bookings by default when isOwner (hidePastBookings branch)', () => {
    const pastBooking = makeB('b-past', BookingStatus.Returned, 'user-1', { pastEnd: true });
    const futureBooking = makeB('b-future', BookingStatus.Pending);
    const { getAllByTestId } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId={OWNER_ID}
        bookings={[pastBooking, futureBooking]}
      />,
      { wrapper: Wrapper }
    );
    // Future booking card shown, past booking filtered out
    expect(getAllByTestId(/booking-card/).length).toBe(1);
  });
});

describe('BookingsListModal — booking creator view', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    jest.useRealTimers();
    spy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...ownerAuthValue,
      user: { id: 'user-1', firstName: 'Creator', userName: 'creator', email: 'c@test.com' },
    });
  });

  afterEach(() => {
    spy.mockRestore();
    jest.useFakeTimers();
  });

  it('renders pickUp action for Approved booking when user is creator', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId="other-owner"
        bookings={[makeB('b1', BookingStatus.Approved, 'user-1')]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.pickUp')).toBeTruthy();
  });

  it('renders submit action for Planning booking when user is creator', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId="other-owner"
        bookings={[makeB('b1', BookingStatus.Planning, 'user-1')]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.submit')).toBeTruthy();
  });

  it('renders early return action for Picked booking with future end date', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId="other-owner"
        bookings={[makeB('b1', BookingStatus.Picked, 'user-1')]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.requestEarlyReturn')).toBeTruthy();
  });

  it('renders regular return action for Picked booking with past end date', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId="other-owner"
        bookings={[makeB('b1', BookingStatus.Picked, 'user-1', { pastEnd: true })]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.requestReturn')).toBeTruthy();
  });

  it('renders viewReturnPhoto for creator when booking has returnPhotoUrl', () => {
    const { getByText } = render(
      <BookingsListModal
        {...baseProps}
        equipmentOwnerId="other-owner"
        bookings={[makeB('b1', BookingStatus.Returned, 'user-1', { returnPhotoUrl: 'http://test.com/p.jpg' })]}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.actions.viewReturnPhoto')).toBeTruthy();
  });
});
