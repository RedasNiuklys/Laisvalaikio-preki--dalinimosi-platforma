import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-geocoding', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    from: jest.fn(() =>
      Promise.resolve({
        results: [
          {
            formatted_address: '123 Test St, Vilnius, Lithuania',
            address_components: [
              { types: ['street_number'], long_name: '123' },
              { types: ['route'], long_name: 'Test St' },
              { types: ['locality'], long_name: 'Vilnius' },
              { types: ['country'], long_name: 'Lithuania' },
              { types: ['administrative_area_level_1'], long_name: 'Vilnius County' },
              { types: ['postal_code'], long_name: 'LT-01001' },
            ],
            geometry: { location: { lat: 54.6872, lng: 25.2797 } },
          },
        ],
      })
    ),
  },
}));
jest.mock('@/src/utils/envConfig', () => ({ BASE_URL: 'http://localhost:5000', GOOGLE_API_KEY: 'test-key' }));
jest.mock('@/src/components/LocationMap', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapMock = React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ animateToLocation: jest.fn() }));
    return React.createElement(View, { testID: 'location-map' });
  });
  MapMock.displayName = 'LocationMapMock';
  return { __esModule: true, default: MapMock };
});
jest.mock('@/src/components/Toast', () => ({ showToast: jest.fn(), ToastContainer: () => null }));
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

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import LocationPicker from '@/src/components/LocationPicker';

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
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LocationPicker', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<LocationPicker />, { wrapper: Wrapper })
    ).not.toThrow();
  });

  it('renders the map component', () => {
    const { getByTestId } = render(<LocationPicker />, { wrapper: Wrapper });
    expect(getByTestId('location-map')).toBeTruthy();
  });

  it('renders a search text input', () => {
    const { UNSAFE_getAllByType } = render(<LocationPicker />, { wrapper: Wrapper });
    const { TextInput } = require('react-native-paper');
    const inputs = UNSAFE_getAllByType(TextInput);
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders with an initialLocation prop without crashing', () => {
    expect(() =>
      render(
        <LocationPicker
          initialLocation={{
            latitude: 54.6872,
            longitude: 25.2797,
            name: 'Vilnius',
            streetAddress: 'Gedimino pr. 1',
            city: 'Vilnius',
            country: 'Lithuania',
            userId: 'u1',
          }}
        />,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });

  it('passes onLocationSelected callback and renders map', () => {
    const onLocationSelected = jest.fn();
    const { getByTestId } = render(
      <LocationPicker onLocationSelected={onLocationSelected} />,
      { wrapper: Wrapper }
    );
    expect(getByTestId('location-map')).toBeTruthy();
  });
});
