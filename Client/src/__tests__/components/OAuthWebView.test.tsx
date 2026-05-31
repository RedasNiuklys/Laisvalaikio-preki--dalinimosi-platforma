import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: ({ testID, source }: any) =>
      React.createElement(View, { testID: testID || 'webview', 'data-uri': source?.uri }),
  };
});
jest.mock('@/src/api/auth', () => ({
  authApi: { login: jest.fn(), logout: jest.fn(), getUser: jest.fn(), register: jest.fn(), getFirebaseToken: jest.fn(), googleLogin: jest.fn(), facebookLogin: jest.fn(), microsoftLogin: jest.fn() },
}));
jest.mock('@/src/utils/firebaseConfig');
jest.mock('@/src/theme/PaperTheme', () => ({
  darkTheme: 'dark',
  lightTheme: 'light',
}));

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import OAuthWebView from '@/src/components/OAuthWebView';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider><ThemeProvider><PaperProvider>{children}</PaperProvider></ThemeProvider></AuthProvider>
);

describe('OAuthWebView', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <OAuthWebView url="http://localhost/auth/google" onNavigationStateChange={jest.fn()} />,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });

  it('renders the WebView component', () => {
    const { getByTestId } = render(
      <OAuthWebView url="http://localhost/auth/google" onNavigationStateChange={jest.fn()} />,
      { wrapper: Wrapper }
    );
    expect(getByTestId('webview')).toBeTruthy();
  });

  it('renders with different OAuth provider URLs', () => {
    expect(() =>
      render(
        <OAuthWebView url="http://localhost/auth/facebook" onNavigationStateChange={jest.fn()} />,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });
});
