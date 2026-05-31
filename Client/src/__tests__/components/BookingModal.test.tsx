import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('react-native-toast-message', () => {
  function T() { return null; }
  (T as any).show = jest.fn();
  return { __esModule: true, default: T };
});

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import BookingModal from '@/src/components/BookingModal';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => { jest.useRealTimers(); });

const baseProps = {
  visible: true,
  onDismiss: jest.fn(),
  onSubmit: jest.fn(),
  equipmentName: 'Red Bicycle',
};

describe('BookingModal', () => {
  it('renders without crashing when visible', () => {
    expect(() =>
      render(<BookingModal {...baseProps} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders equipment name', () => {
    const { getByText } = render(<BookingModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('Red Bicycle')).toBeTruthy();
  });

  it('renders booking.new title via i18n key', () => {
    const { getByText } = render(<BookingModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('booking.new')).toBeTruthy();
  });

  it('renders booking.submit button', () => {
    const { getByText } = render(<BookingModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('booking.submit')).toBeTruthy();
  });

  it('shows owner auto-approval banner when isOwner=true', () => {
    const { getByText } = render(
      <BookingModal {...baseProps} isOwner />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.ownerAutoApproval')).toBeTruthy();
  });

  it('does not show owner banner when isOwner=false', () => {
    const { queryByText } = render(
      <BookingModal {...baseProps} isOwner={false} />,
      { wrapper: Wrapper }
    );
    expect(queryByText('booking.ownerAutoApproval')).toBeNull();
  });

  it('shows notify-owner checkbox when not owner', () => {
    const { getByText } = render(
      <BookingModal {...baseProps} isOwner={false} />,
      { wrapper: Wrapper }
    );
    expect(getByText('booking.notifications.notifyOwner')).toBeTruthy();
  });

  it('does not show notify-owner checkbox when owner', () => {
    const { queryByText } = render(
      <BookingModal {...baseProps} isOwner />,
      { wrapper: Wrapper }
    );
    expect(queryByText('booking.notifications.notifyOwner')).toBeNull();
  });

  it('calls onDismiss when back button is pressed', () => {
    const onDismiss = jest.fn();
    const { getAllByRole } = render(
      <BookingModal {...baseProps} onDismiss={onDismiss} />,
      { wrapper: Wrapper }
    );
    const buttons = getAllByRole('button');
    fireEvent.press(buttons[0]);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('calls onSubmit and onDismiss when submit button is pressed', () => {
    const onSubmit = jest.fn();
    const onDismiss = jest.fn();
    const { getByText } = render(
      <BookingModal {...baseProps} onSubmit={onSubmit} onDismiss={onDismiss} />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByText('booking.submit'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      expect.any(String),
      expect.any(Boolean)
    );
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders with initialDate prop', () => {
    const initialDate = new Date('2026-07-01');
    expect(() =>
      render(<BookingModal {...baseProps} initialDate={initialDate} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders notes input field', () => {
    const { getByText } = render(<BookingModal {...baseProps} />, { wrapper: Wrapper });
    expect(getByText('booking.notes')).toBeTruthy();
  });

  it('renders start and end date labels', () => {
    const { getAllByText } = render(<BookingModal {...baseProps} />, { wrapper: Wrapper });
    expect(getAllByText('booking.startDateTime').length).toBeGreaterThan(0);
    expect(getAllByText('booking.endDateTime').length).toBeGreaterThan(0);
  });
});
