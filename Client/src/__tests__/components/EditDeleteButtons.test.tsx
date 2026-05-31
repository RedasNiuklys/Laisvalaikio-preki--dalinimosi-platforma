import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import EditDeleteButtons from '@/src/components/EditDeleteButtons';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('EditDeleteButtons', () => {
  it('fires onEdit callback when the edit button is pressed', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = render(
      <EditDeleteButtons onEdit={onEdit} onDelete={onDelete} />,
      { wrapper: Wrapper }
    );
    // i18n mock returns key: t('common.buttons.edit') => 'common.buttons.edit'
    fireEvent.press(getByText('common.buttons.edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('fires onDelete callback when the delete button is pressed', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = render(
      <EditDeleteButtons onEdit={onEdit} onDelete={onDelete} />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByText('common.buttons.delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('renders custom labels when provided', () => {
    const { getByText } = render(
      <EditDeleteButtons
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        editLabel="equipment.edit"
        deleteLabel="equipment.remove"
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('equipment.edit')).toBeTruthy();
    expect(getByText('equipment.remove')).toBeTruthy();
  });
});
