import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/src/utils/envConfig', () => ({
  BASE_URL: 'http://localhost',
  LOGIN_ENDPOINT: 'http://localhost/api/login',
}));

import OAuthWebHandler from '@/src/components/OAuthWebHandler';

describe('OAuthWebHandler', () => {
  it('renders without crashing (returns null)', () => {
    const { toJSON } = render(
      <OAuthWebHandler
        provider="Google"
        onSuccess={jest.fn()}
        onError={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders null for Facebook provider', () => {
    const { toJSON } = render(
      <OAuthWebHandler
        provider="Facebook"
        onSuccess={jest.fn()}
        onError={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });
});
