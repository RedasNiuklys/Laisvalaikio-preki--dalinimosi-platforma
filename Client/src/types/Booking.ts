import { Equipment } from './Equipment';
import { User } from './User';

export enum BookingStatus {
    Pending = 'Pending',
    Planning = 'Planning',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Cancelled = 'Cancelled'
}

// Backend numeric enum values
export enum BookingStatusNumeric {
    Pending = 0,
    Planning = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4
}

// Conversion utilities
export const bookingStatusToNumeric = (status: BookingStatus): BookingStatusNumeric => {
    const mapping: Record<BookingStatus, BookingStatusNumeric> = {
        [BookingStatus.Pending]: BookingStatusNumeric.Pending,
        [BookingStatus.Planning]: BookingStatusNumeric.Planning,
        [BookingStatus.Approved]: BookingStatusNumeric.Approved,
        [BookingStatus.Rejected]: BookingStatusNumeric.Rejected,
        [BookingStatus.Cancelled]: BookingStatusNumeric.Cancelled
    };
    return mapping[status];
};

export const numericToBookingStatus = (status: BookingStatusNumeric): BookingStatus => {
    const mapping: Record<BookingStatusNumeric, BookingStatus> = {
        [BookingStatusNumeric.Pending]: BookingStatus.Pending,
        [BookingStatusNumeric.Planning]: BookingStatus.Planning,
        [BookingStatusNumeric.Approved]: BookingStatus.Approved,
        [BookingStatusNumeric.Rejected]: BookingStatus.Rejected,
        [BookingStatusNumeric.Cancelled]: BookingStatus.Cancelled
    };
    return mapping[status];
};

export interface Booking {
    id: string;
    equipmentId: string;
    userId: string;
    startDateTime: string;
    endDateTime: string;
    status: BookingStatus;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
    equipment?: Equipment;
    user?: User;
}

export interface CreateBookingDto {
    equipmentId: string;
    startDateTime: string;
    endDateTime: string;
    status: BookingStatus;
    notes?: string;
}

export interface UpdateBookingDto {
    startDateTime?: string;
    endDateTime?: string;
    status?: BookingStatus;
    notes?: string;
} 