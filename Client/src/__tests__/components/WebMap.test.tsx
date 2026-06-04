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

function cleanGlobalMaps() {
  delete (window as any).google;
  delete (window as any).__googleMapsLoaderPromise;
  delete (window as any).__googleMapsLoaderLanguage;
}

function setupGoogleMock(language = 'en') {
  (window as any).google = {
    maps: {
      Map: jest.fn(() => ({
        setCenter: jest.fn(), setZoom: jest.fn(),
        panTo: jest.fn(), addListener: jest.fn(),
      })),
      Marker: jest.fn(() => ({ setMap: jest.fn(), addListener: jest.fn() })),
      SymbolPath: { CIRCLE: 'circle' },
    },
  };
  (window as any).__googleMapsLoaderLanguage = language;
}

beforeEach(() => {
  jest.clearAllMocks();
  cleanGlobalMaps();
});

afterEach(() => {
  cleanGlobalMaps();
});

describe('WebMap — basic rendering', () => {
  it('renders without crashing with no locations', () => {
    expect(() => render(<WebMap {...baseProps} />)).not.toThrow();
  });

  it('renders without crashing with isAddingLocation=true', () => {
    expect(() =>
      render(<WebMap {...baseProps} isAddingLocation />)
    ).not.toThrow();
  });

  it('renders without crashing with initialPosition provided', () => {
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

describe('WebMap — initialPosition branch', () => {
  it('uses default position when initialPosition is not provided', () => {
    // initialPosition = undefined → uses default lat/lng
    expect(() => render(<WebMap {...baseProps} initialPosition={undefined} />)).not.toThrow();
  });

  it('uses custom initialPosition when provided', () => {
    expect(() =>
      render(<WebMap {...baseProps} initialPosition={{ lat: 55.0, lng: 24.0 }} />)
    ).not.toThrow();
  });

  it('calls geolocation.getCurrentPosition when no initialPosition and geolocation available', () => {
    const getCurrentPosition = jest.fn((success: Function) => {
      success({ coords: { latitude: 55.5, longitude: 24.5 } });
    });
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition, watchPosition: jest.fn(), clearWatch: jest.fn() },
      configurable: true,
      writable: true,
    });
    render(<WebMap {...baseProps} />);
    expect(getCurrentPosition).toHaveBeenCalled();
    // Cleanup
    Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true, writable: true });
  });

  it('handles geolocation error callback without crashing', () => {
    const getCurrentPosition = jest.fn((_: Function, errorCb: Function) => {
      errorCb(new Error('Permission denied'));
    });
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition, watchPosition: jest.fn(), clearWatch: jest.fn() },
      configurable: true,
      writable: true,
    });
    expect(() => render(<WebMap {...baseProps} />)).not.toThrow();
    Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true, writable: true });
  });
});

describe('WebMap — google maps already loaded (early return branch)', () => {
  it('takes early return when window.google is pre-loaded with matching language', () => {
    setupGoogleMock('en');
    // Early return path is taken — no __googleMapsLoaderPromise should be created
    render(<WebMap {...baseProps} />);
    expect((window as any).__googleMapsLoaderPromise).toBeUndefined();
  });

  it('renders with locations having valid lat/lng (marker creation branch)', () => {
    setupGoogleMock('en');
    const locations = [
      { id: 'loc-1', name: 'Park', streetAddress: '1 St', city: 'V', country: 'LT', latitude: 54.9, longitude: 25.3, userId: 'u1' },
    ];
    expect(() => render(<WebMap {...baseProps} locations={locations} />)).not.toThrow();
  });

  it('renders with location having zero lat/lng (falsy branch — no marker)', () => {
    setupGoogleMock('en');
    const locations = [
      { id: 'loc-zero', name: 'Zero', streetAddress: '', city: '', country: '', latitude: 0, longitude: 0, userId: 'u1' },
    ];
    expect(() => render(<WebMap {...baseProps} locations={locations} />)).not.toThrow();
  });

  it('renders with selectedLocation not in locations list', () => {
    setupGoogleMock('en');
    const selectedLocation = {
      id: 'sel-1', name: 'Selected', streetAddress: '99 St', city: 'V', country: 'LT',
      latitude: 55.0, longitude: 25.0, userId: 'u1',
    };
    expect(() =>
      render(<WebMap {...baseProps} selectedLocation={selectedLocation} />)
    ).not.toThrow();
  });

  it('renders with selectedLocation matching a location in the list', () => {
    setupGoogleMock('en');
    const loc = {
      id: 'loc-match', name: 'Match', streetAddress: '10 St', city: 'V', country: 'LT',
      latitude: 54.8, longitude: 25.1, userId: 'u1',
    };
    expect(() =>
      render(<WebMap {...baseProps} locations={[loc]} selectedLocation={loc} />)
    ).not.toThrow();
  });
});

describe('WebMap — Lithuanian language branch', () => {
  it('normalises "lt" language correctly (normalizeMapLanguage branch)', () => {
    // Mutate the mocked i18n module to simulate lt language
    const i18nMock = require('@/src/i18n');
    i18nMock.language = 'lt';
    setupGoogleMock('lt'); // loader cached with 'lt'
    expect(() => render(<WebMap {...baseProps} />)).not.toThrow();
    // Early return taken because normalizeMapLanguage('lt') === 'lt' → matches loader language
    expect((window as any).__googleMapsLoaderPromise).toBeUndefined();
    i18nMock.language = 'en'; // restore for other tests
  });
});

describe('WebMap — existing loader promise branch', () => {
  it('reuses existing __googleMapsLoaderPromise when language matches', () => {
    // Set up an existing loader promise with matching language
    (window as any).__googleMapsLoaderPromise = Promise.resolve();
    (window as any).__googleMapsLoaderLanguage = 'en';
    // Component render: loadGoogleMapsApi checks existing promise → returns it
    expect(() => render(<WebMap {...baseProps} />)).not.toThrow();
  });
});
