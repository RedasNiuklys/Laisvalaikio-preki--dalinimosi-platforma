import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hanging promises: component stays in loading state — no post-render state updates = no memory leak
jest.mock('@/src/api/equipmentApi', () => ({
  getById: jest.fn(() => new Promise(() => {})),
  deleteEquipment: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/bookingApi', () => ({
  getBookingsForEquipment: jest.fn(() => new Promise(() => {})),
  createBooking: jest.fn(() => new Promise(() => {})),
  updateBooking: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/userApi', () => ({
  getUserById: jest.fn(() => new Promise(() => {})),
  updateUserThemePreference: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/reviewApi', () => ({
  getReviewEligibility: jest.fn(() => new Promise(() => {})),
  createReview: jest.fn(() => new Promise(() => {})),
  updateReview: jest.fn(() => new Promise(() => {})),
  deleteReview: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/api/maintenanceApi', () => ({
  getByEquipment: jest.fn(() => new Promise(() => {})),
  create: jest.fn(() => new Promise(() => {})),
  remove: jest.fn(() => new Promise(() => {})),
}));
jest.mock('@/src/services/ChatService', () => ({
  chatService: { sendMessage: jest.fn(() => new Promise(() => {})) },
}));
jest.mock('@/src/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getUser: jest.fn(),
    register: jest.fn(),
    getFirebaseToken: jest.fn(),
    googleLogin: jest.fn(),
    facebookLogin: jest.fn(),
    microsoftLogin: jest.fn(),
  },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/components/Toast', () => ({
  showToast: jest.fn(),
  ToastContainer: () => null,
}));
jest.mock('@/src/components/LocationMap', () => () => null);
jest.mock('@/src/components/BookingModal', () => () => null);
jest.mock('@/src/components/BookingsCalendar', () => () => null);
jest.mock('@/src/components/BookingsListModal', () => () => null);
jest.mock('@/src/components/AddToCalendarDialog', () => () => null);
jest.mock('@/src/utils/calendarUtils', () => ({
  resolveCalendarMode: jest.fn(() => 'web_both'),
  buildEventDetails: jest.fn(),
  buildGoogleCalendarUrl: jest.fn(() => ''),
  buildOutlookCalendarUrl: jest.fn(() => ''),
  addToDeviceCalendar: jest.fn(() => Promise.resolve('success')),
}));
jest.mock('@/src/utils/envConfig', () => ({ BASE_URL: 'http://localhost:5000' }));
jest.mock('react-native-maps', () => ({ default: () => null, Marker: () => null }));
jest.mock('react-rating', () => () => null);
jest.mock('axios');
jest.mock('@/src/i18n', () => ({
  default: {
    t: (key: string, opts?: any) => (opts?.defaultValue ?? key),
    language: 'en',
    changeLanguage: jest.fn(),
  },
}));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import EquipmentDetailsPage from '@/src/pages/equipment/EquipmentDetailsPage';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      <PaperProvider>{children}</PaperProvider>
    </ThemeProvider>
  </AuthProvider>
);

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('EquipmentDetailsPage', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with openBookingsListOnLoad prop without crashing', () => {
    expect(() =>
      render(<EquipmentDetailsPage id="eq-1" openBookingsListOnLoad={false} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with initialBookingId prop without crashing', () => {
    expect(() =>
      render(<EquipmentDetailsPage id="eq-1" initialBookingId="b-1" />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders with openBookingsListOnLoad=true without crashing', () => {
    expect(() =>
      render(<EquipmentDetailsPage id="eq-1" openBookingsListOnLoad={true} />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('shows loading indicator while data is loading', () => {
    const { UNSAFE_getByType } = render(
      <EquipmentDetailsPage id="eq-1" />,
      { wrapper: Wrapper }
    );
    const { ActivityIndicator } = require('react-native-paper');
    // Component starts in loading state — ActivityIndicator is present
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});

describe('EquipmentDetailsPage — API interactions', () => {
  it('calls getById with the provided id', async () => {
    const { getById } = require('@/src/api/equipmentApi');
    render(<EquipmentDetailsPage id="eq-42" />, { wrapper: Wrapper });
    await waitFor(() => expect(getById).toHaveBeenCalledWith('eq-42'));
  });

  it('calls getById immediately on mount with a different id', async () => {
    const { getById } = require('@/src/api/equipmentApi');
    render(<EquipmentDetailsPage id="eq-99" />, { wrapper: Wrapper });
    await waitFor(() => expect(getById).toHaveBeenCalledWith('eq-99'));
  });
});
