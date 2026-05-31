import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EquipmentCard } from '@/src/components/EquipmentCard';

const baseEquipment = {
  id: 'eq-1',
  name: 'Mountain Bike',
  description: 'A great bike for trails',
  isAvailable: true,
  images: [],
  ownerId: 'u1',
  categoryId: 1,
  category: { id: 1, name: 'Sports', slug: 'sports', parentCategoryId: null },
  location: null,
  tags: [],
  condition: 'Good',
  createdAt: '2026-01-01',
  bookings: [],
  maintenanceHistory: [],
} as any;

describe('EquipmentCard', () => {
  it('renders the equipment name', () => {
    const { getByText } = render(
      <EquipmentCard equipment={baseEquipment} onPress={jest.fn()} />
    );
    expect(getByText('Mountain Bike')).toBeTruthy();
  });

  it('renders the equipment description', () => {
    const { getByText } = render(
      <EquipmentCard equipment={baseEquipment} onPress={jest.fn()} />
    );
    expect(getByText('A great bike for trails')).toBeTruthy();
  });

  it('shows "Available" when isAvailable is true', () => {
    const { getByText } = render(
      <EquipmentCard equipment={baseEquipment} onPress={jest.fn()} />
    );
    expect(getByText('Available')).toBeTruthy();
  });

  it('shows "Unavailable" when isAvailable is false', () => {
    const { getByText } = render(
      <EquipmentCard
        equipment={{ ...baseEquipment, isAvailable: false }}
        onPress={jest.fn()}
      />
    );
    expect(getByText('Unavailable')).toBeTruthy();
  });

  it('calls onPress when the card is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EquipmentCard equipment={baseEquipment} onPress={onPress} />
    );
    fireEvent.press(getByText('Mountain Bike'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
