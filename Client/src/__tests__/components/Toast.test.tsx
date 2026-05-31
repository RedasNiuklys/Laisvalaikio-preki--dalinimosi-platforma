import React from 'react';
import { render } from '@testing-library/react-native';

// Factory must be self-contained — outer-scope variables are hoisted BEFORE they're initialised
jest.mock('react-native-toast-message', () => {
  const show = jest.fn();
  function ToastMock() { return null; }
  (ToastMock as any).show = show;
  return { __esModule: true, default: ToastMock };
});

import { showToast, ToastContainer } from '@/src/components/Toast';
import Toast from 'react-native-toast-message';

const mockedShow = Toast.show as jest.Mock;

beforeEach(() => {
  mockedShow.mockClear();
});

describe('showToast', () => {
  it('calls Toast.show with type "success"', () => {
    showToast('success', 'Saved successfully');
    expect(mockedShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: 'Saved successfully' })
    );
  });

  it('calls Toast.show with type "error"', () => {
    showToast('error', 'Something went wrong');
    expect(mockedShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: 'Something went wrong' })
    );
  });

  it('calls Toast.show with type "info"', () => {
    showToast('info', 'Just a heads-up');
    expect(mockedShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info', text1: 'Just a heads-up' })
    );
  });

  it('enables autoHide', () => {
    showToast('info', 'msg');
    expect(mockedShow).toHaveBeenCalledWith(
      expect.objectContaining({ autoHide: true })
    );
  });
});

describe('ToastContainer', () => {
  it('renders without throwing', () => {
    expect(() => render(<ToastContainer />)).not.toThrow();
  });
});
