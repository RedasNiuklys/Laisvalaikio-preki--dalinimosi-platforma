import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
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
jest.mock('@/src/components/UserProfileCard', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/src/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string, opts?: any) => (opts?.defaultValue ?? key),
    language: 'en',
    changeLanguage: jest.fn(),
  },
}));

import { AuthProvider } from '@/src/context/AuthContext';
import * as AuthContextModule from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import EquipmentDetailsPage from '@/src/pages/equipment/EquipmentDetailsPage';
import { BookingStatus } from '@/src/types/Booking';

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

// ---------------------------------------------------------------------------
// Helpers shared across loaded-state describe blocks
// ---------------------------------------------------------------------------

const baseEquipment = {
  id: 'eq-1',
  name: 'Test Bike',
  description: 'A bicycle for outdoor activities',
  category: { slug: 'cycling', name: 'Cycling' },
  ownerId: 'owner-999',
  isAvailable: true,
  images: [
    { id: 'img-1', imageUrl: 'http://test.com/img.jpg', url: null },
    { id: 'img-2', imageUrl: null, url: null }, // both null → returns null in map
  ],
  location: {
    streetAddress: '1 Main St', city: 'Vilnius', country: 'Lithuania',
    latitude: 54.68, longitude: 25.27,
  },
  reviews: [] as any[],
};

const mockOwner = {
  id: 'owner-999', firstName: 'John', lastName: 'Doe',
  userName: 'johndoe', email: 'john@test.com',
};

function setupLoadedMocks(
  equipmentOverrides: Record<string, any> = {},
  bookings: any[] = [],
  maintenanceRecords: any[] = [],
  eligibility: any = { canReview: false, reason: 'no booking' },
) {
  const equipApi = require('@/src/api/equipmentApi');
  const bookApi = require('@/src/api/bookingApi');
  const maintApi = require('@/src/api/maintenanceApi');
  const reviewApi = require('@/src/api/reviewApi');
  const userApi = require('@/src/api/userApi');
  equipApi.getById.mockResolvedValue({ ...baseEquipment, ...equipmentOverrides });
  bookApi.getBookingsForEquipment.mockResolvedValue(bookings);
  maintApi.getByEquipment.mockResolvedValue(maintenanceRecords);
  reviewApi.getReviewEligibility.mockResolvedValue(eligibility);
  userApi.getUserById.mockResolvedValue(mockOwner);
}

// ---------------------------------------------------------------------------

describe('EquipmentDetailsPage — error state', () => {
  it('shows not-found text when fetch rejects', async () => {
    const { getById } = require('@/src/api/equipmentApi');
    getById.mockRejectedValue(new Error('Network error'));
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('equipment.errors.notFound')).toBeTruthy());
  });
});

describe('EquipmentDetailsPage — loaded state (basic)', () => {
  beforeEach(() => setupLoadedMocks());

  it('shows equipment name after successful load', async () => {
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('Test Bike')).toBeTruthy());
  });

  it('shows no-reviews text when reviews array is empty', async () => {
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('equipment.reviews.noReviews')).toBeTruthy());
  });

  it('shows no-maintenance text when no records', async () => {
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('maintenance.noRecords')).toBeTruthy());
  });

  it('shows available status when no blocking bookings', async () => {
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText(/equipment\.available/)).toBeTruthy());
  });
});

describe('EquipmentDetailsPage — loaded state (with content)', () => {
  it('shows maintenance record with notes', async () => {
    setupLoadedMocks({}, [], [
      { id: 1, title: 'Oil Change', description: 'Changed oil', maintenanceDate: '2026-01-01', performedBy: 'Tech', notes: 'Used synthetic oil' },
    ]);
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('Oil Change')).toBeTruthy());
    expect(getByText('Used synthetic oil')).toBeTruthy();
  });

  it('shows maintenance record without notes (null notes branch)', async () => {
    setupLoadedMocks({}, [], [
      { id: 2, title: 'Tire Fix', description: 'Fixed tire', maintenanceDate: '2026-02-01', performedBy: 'Tech', notes: null },
    ]);
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('Tire Fix')).toBeTruthy());
  });

  it('shows average rating text when reviews exist', async () => {
    const reviewer = { id: 'rev-1', firstName: 'Alice', lastName: 'Smith', userName: 'alice', email: 'alice@test.com' };
    setupLoadedMocks({
      reviews: [
        { id: 'r1', rating: 4, comment: 'Great!', createdAt: '2026-01-01', updatedAt: null, reviewerId: 'rev-1', userId: 'other-user', reviewer, equipmentId: 'eq-1', bookingId: 'b1' },
      ],
    });
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText(/4\.0\s*\/\s*5/)).toBeTruthy());
  });

  it('shows unavailable when active blocking booking exists', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    setupLoadedMocks({}, [{
      id: 'b-active', equipmentId: 'eq-1', userId: 'u-1',
      status: BookingStatus.Approved,
      startDateTime: yesterday, endDateTime: tomorrow, notes: '',
    }]);
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText(/equipment\.unavailable/)).toBeTruthy());
  });

  it('shows owner controls when logged-in user is equipment owner', async () => {
    // Bypass the AuthContext singleton by spying on useAuth directly
    const spy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'owner-999', firstName: 'Me', lastName: 'Owner', userName: 'me', email: 'me@test.com' } as any,
      isAuthenticated: true,
      authProvider: '',
      loadUser: jest.fn(),
      token: 'mock-token',
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any);
    setupLoadedMocks();
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('equipment.actions.edit')).toBeTruthy());
    expect(getByText('equipment.actions.delete')).toBeTruthy();
    expect(getByText('maintenance.add')).toBeTruthy();
    spy.mockRestore();
  });
});

describe('EquipmentDetailsPage — reviews modal', () => {
  it('shows eligibility hint in modal when canReview is false', async () => {
    setupLoadedMocks({}, [], [], { canReview: false, reason: 'not eligible' });
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('equipment.reviews.show')).toBeTruthy());
    fireEvent.press(getByText('equipment.reviews.show'));
    await waitFor(() => expect(getByText('equipment.reviews.eligibilityHint')).toBeTruthy());
  });

  it('shows review form in modal when canReview is true', async () => {
    setupLoadedMocks({}, [], [], { canReview: true, reason: null, eligibleBookingId: 'b-1' });
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('equipment.reviews.show')).toBeTruthy());
    fireEvent.press(getByText('equipment.reviews.show'));
    await waitFor(() => expect(getByText('equipment.reviews.yourReview')).toBeTruthy());
  });

  it('shows review comment and edited tag when review has updatedAt', async () => {
    const reviewer = { id: 'rev-1', firstName: 'Alice', lastName: 'Smith', userName: 'alice', email: 'alice@test.com' };
    setupLoadedMocks({
      reviews: [
        { id: 'r1', rating: 4, comment: 'Really great!', createdAt: '2026-01-01', updatedAt: '2026-02-01', reviewerId: 'rev-1', userId: 'other-user', reviewer, equipmentId: 'eq-1', bookingId: 'b1' },
      ],
    });
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('equipment.reviews.show')).toBeTruthy());
    fireEvent.press(getByText('equipment.reviews.show'));
    await waitFor(() => expect(getByText('Really great!')).toBeTruthy());
    expect(getByText('equipment.reviews.edited')).toBeTruthy();
  });

  it('shows pagination when reviews exceed page size', async () => {
    const reviewer = { id: 'rev-1', firstName: 'Alice', lastName: 'Smith', userName: 'alice', email: 'alice@test.com' };
    const manyReviews = Array.from({ length: 4 }, (_, i) => ({
      id: `r${i}`, rating: 5, comment: `Review ${i}`, createdAt: '2026-01-01', updatedAt: null,
      reviewerId: 'rev-1', userId: 'other-user', reviewer, equipmentId: 'eq-1', bookingId: `b${i}`,
    }));
    setupLoadedMocks({ reviews: manyReviews });
    const { getByText } = render(<EquipmentDetailsPage id="eq-1" />, { wrapper: Wrapper });
    await waitFor(() => expect(getByText('equipment.reviews.show')).toBeTruthy());
    fireEvent.press(getByText('equipment.reviews.show'));
    await waitFor(() => expect(getByText('equipment.reviews.nextPage')).toBeTruthy());
    expect(getByText('equipment.reviews.previousPage')).toBeTruthy();
  });
});
