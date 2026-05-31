import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

import ImageViewer from '@/src/components/ImageViewer';

const placeholderSource = { uri: 'https://example.com/placeholder.png' };

describe('ImageViewer', () => {
  it('renders without crashing', () => {
    expect(() => render(<ImageViewer imgSource={placeholderSource} />)).not.toThrow();
  });

  it('uses selectedImage URI when provided', () => {
    const { UNSAFE_getByType } = render(
      <ImageViewer imgSource={placeholderSource} selectedImage="https://example.com/selected.png" />
    );
    const img = UNSAFE_getByType('ExpoImage' as any);
    expect(img.props.source).toEqual({ uri: 'https://example.com/selected.png' });
  });

  it('falls back to imgSource when selectedImage is empty', () => {
    const { UNSAFE_getByType } = render(
      <ImageViewer imgSource={placeholderSource} selectedImage="" />
    );
    const img = UNSAFE_getByType('ExpoImage' as any);
    expect(img.props.source).toEqual(placeholderSource);
  });

  it('falls back to imgSource when selectedImage is only whitespace', () => {
    const { UNSAFE_getByType } = render(
      <ImageViewer imgSource={placeholderSource} selectedImage="   " />
    );
    const img = UNSAFE_getByType('ExpoImage' as any);
    expect(img.props.source).toEqual(placeholderSource);
  });

  it('falls back to imgSource when selectedImage is undefined', () => {
    const { UNSAFE_getByType } = render(
      <ImageViewer imgSource={placeholderSource} />
    );
    const img = UNSAFE_getByType('ExpoImage' as any);
    expect(img.props.source).toEqual(placeholderSource);
  });
});
