import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/src/utils/envConfig', () => ({
  BASE_URL: 'http://localhost',
  GOOGLE_API_KEY: 'test-key',
}));
jest.mock('@/src/i18n', () => ({
  language: 'en',
  t: (k: string) => k,
  on: jest.fn(),
  off: jest.fn(),
}));

import WebMap from '@/src/components/WebMap';

const baseProps = {
  onLocationSelect: jest.fn(),
  locations: [],
  onLocationClick: jest.fn(),
  isAddingLocation: false,
  selectedLocation: null,
};

describe('WebMap', () => {
  it('renders without crashing with no locations', () => {
    expect(() => render(<WebMap {...baseProps} />)).not.toThrow();
  });

  it('renders without crashing with isAddingLocation=true', () => {
    expect(() =>
      render(<WebMap {...baseProps} isAddingLocation />)
    ).not.toThrow();
  });

  it('renders without crashing with an initial position', () => {
    expect(() =>
      render(<WebMap {...baseProps} initialPosition={{ lat: 54.9, lng: 23.9 }} />)
    ).not.toThrow();
  });

  it('renders without crashing with locations provided', () => {
    const locations = [
      { id: 'loc-1', name: 'Home', address: '123 St', latitude: 54.9, longitude: 23.9 },
    ];
    expect(() =>
      render(<WebMap {...baseProps} locations={locations as any} />)
    ).not.toThrow();
  });
});
