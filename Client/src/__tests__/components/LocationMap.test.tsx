import React from 'react';
import { render } from '@testing-library/react-native';

// Mock WebMap since it uses Google Maps API
jest.mock('@/src/components/WebMap', () => () => null);
jest.mock('@/src/utils/envConfig', () => ({
  BASE_URL: 'http://localhost',
  GOOGLE_API_KEY: 'test-key',
}));
jest.mock('@/src/i18n', () => ({
  language: 'en',
  t: (k: string) => k,
}));
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = ({ children, onPress, testID }: any) =>
    React.createElement(View, { testID: testID || 'map-view', onPress }, children);
  const Marker = ({ children }: any) =>
    React.createElement(View, null, children);
  const Callout = ({ children }: any) =>
    React.createElement(View, null, children);
  return {
    __esModule: true,
    default: MapView,
    Marker,
    Callout,
    PROVIDER_DEFAULT: 'default',
  };
});

// Direct import of the base interface file
import LocationMap from '@/src/components/LocationMap';

describe('LocationMap (base interface)', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <LocationMap
          onLocationSelect={jest.fn()}
          locations={[]}
        />
      )
    ).not.toThrow();
  });
});

// Test the web variant directly
describe('LocationMap.web', () => {
  it('renders without crashing', () => {
    const LocationMapWeb = require('@/src/components/LocationMap.web').default;
    expect(() =>
      render(
        <LocationMapWeb
          onLocationSelect={jest.fn()}
          locations={[]}
        />
      )
    ).not.toThrow();
  });
});

// Test MobileMap directly
describe('MobileMap', () => {
  it('renders without crashing', () => {
    const MobileMap = require('@/src/components/MobileMap').default;
    const { PaperProvider } = require('react-native-paper');
    const Wrapper = ({ children }: any) =>
      React.createElement(PaperProvider, null, children);
    expect(() =>
      render(
        <MobileMap
          onLocationSelect={jest.fn()}
          initialPosition={{ latitude: 54.9, longitude: 23.9 }}
          locations={[]}
          onLocationClick={jest.fn()}
          isAddingLocation={false}
          selectedLocation={null}
        />,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });
});
