import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons/FontAwesome', () => 'FontAwesome');

import Button from '@/src/components/Button';

describe('Button', () => {
  it('renders label text (primary theme)', () => {
    const { getByText } = render(<Button label="Save" theme="primary" />);
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed (primary theme)', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Save" theme="primary" onPress={onPress} />);
    fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders label text (default theme)', () => {
    const { getByText } = render(<Button label="Default" />);
    expect(getByText('Default')).toBeTruthy();
  });

  it('renders without onPress prop (primary theme)', () => {
    expect(() => render(<Button label="No handler" theme="primary" />)).not.toThrow();
  });
});
