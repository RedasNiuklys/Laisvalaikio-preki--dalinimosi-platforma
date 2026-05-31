import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/src/utils/envConfig', () => ({
  BASE_URL: 'http://localhost',
  LOGIN_ENDPOINT: 'http://localhost/api/login',
}));
jest.mock('@/src/components/OAuthWebView', () => () => null);

import OAuthMobileHandler from '@/src/components/OAuthMobileHandler';

describe('OAuthMobileHandler', () => {
  const baseProps = {
    provider: 'Google',
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing when visible', () => {
    expect(() => render(<OAuthMobileHandler {...baseProps} />)).not.toThrow();
  });

  it('renders without crashing when not visible', () => {
    expect(() =>
      render(<OAuthMobileHandler {...baseProps} visible={false} />)
    ).not.toThrow();
  });

  it('renders for different providers', () => {
    expect(() =>
      render(<OAuthMobileHandler {...baseProps} provider="Facebook" />)
    ).not.toThrow();
    expect(() =>
      render(<OAuthMobileHandler {...baseProps} provider="Microsoft" />)
    ).not.toThrow();
  });
});
