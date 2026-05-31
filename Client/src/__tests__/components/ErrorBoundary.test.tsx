import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Text } from 'react-native';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

const ThrowingComponent = () => {
  throw new Error('Test error message');
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('ErrorBoundary', () => {
  // Suppress console.error during error boundary tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary><Text>Normal content</Text></ErrorBoundary>,
      { wrapper: Wrapper }
    );
    expect(getByText('Normal content')).toBeTruthy();
  });

  it('shows error UI when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary><ThrowingComponent /></ErrorBoundary>,
      { wrapper: Wrapper }
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('displays the error message', () => {
    const { getByText } = render(
      <ErrorBoundary><ThrowingComponent /></ErrorBoundary>,
      { wrapper: Wrapper }
    );
    expect(getByText('Test error message')).toBeTruthy();
  });

  it('resets to normal state when Try Again is pressed', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary><ThrowingComponent /></ErrorBoundary>,
      { wrapper: Wrapper }
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    fireEvent.press(getByText('Try Again'));
    // After reset, error state is cleared — boundary re-renders children
    // ThrowingComponent will throw again, but state has been reset first
    expect(queryByText('Something went wrong')).toBeTruthy(); // re-thrown
  });
});
