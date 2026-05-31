import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ImageList } from '@/src/components/ImageList';

describe('ImageList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing with empty images', () => {
    expect(() =>
      render(<ImageList images={[]} onAddImage={jest.fn()} onRemoveImage={jest.fn()} />)
    ).not.toThrow();
  });

  it('renders without crashing with images provided', () => {
    expect(() =>
      render(
        <ImageList
          images={['http://example.com/a.jpg', 'http://example.com/b.jpg']}
          onAddImage={jest.fn()}
          onRemoveImage={jest.fn()}
        />
      )
    ).not.toThrow();
  });

  it('calls onAddImage when add button is pressed', () => {
    const onAddImage = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <ImageList images={[]} onAddImage={onAddImage} onRemoveImage={jest.fn()} />
    );
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(onAddImage).toHaveBeenCalled();
  });

  it('calls onRemoveImage with correct index when remove is pressed', () => {
    const onRemoveImage = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <ImageList
        images={['http://example.com/a.jpg', 'http://example.com/b.jpg']}
        onAddImage={jest.fn()}
        onRemoveImage={onRemoveImage}
      />
    );
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // touchables[0] = add button, touchables[1] = remove for first image
    fireEvent.press(touchables[1]);
    expect(onRemoveImage).toHaveBeenCalledWith(0);
  });

  it('filters out empty-string image URIs', () => {
    const { UNSAFE_getAllByType } = render(
      <ImageList
        images={['', 'http://example.com/valid.jpg', '']}
        onAddImage={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Only 1 valid image: add-button + 1 remove-button = 2
    expect(touchables.length).toBe(2);
  });

  it('renders correct number of remove buttons for each valid image', () => {
    const { UNSAFE_getAllByType } = render(
      <ImageList
        images={['http://a.com/1.jpg', 'http://a.com/2.jpg', 'http://a.com/3.jpg']}
        onAddImage={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // add-button + 3 remove-buttons = 4
    expect(touchables.length).toBe(4);
  });
});
