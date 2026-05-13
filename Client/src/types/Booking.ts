import { Equipment } from './Equipment';
import { User } from './User';

export enum BookingStatus {
    Pending = 'Pending',
    Planning = 'Planning',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Cancelled = 'Cancelled',
    Picked = 'Picked',
    ReturnRequested = 'ReturnRequested',
    ReturnEarlyRequested = 'ReturnEarlyRequested',
    Returned = 'Returned',
    ReturnedEarly = 'ReturnedEarly'
}
export enum BookingStatusFiltered {
    Pending = 'Pending',
    Planning = 'Planning',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Cancelled = 'Cancelled',
}

export enum BookingStatusNumeric {
    Pending = 0,
    Planning = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4,
    Picked = 5,
    ReturnRequested = 6,
    ReturnEarlyRequested = 7,
    Returned = 8,
    ReturnedEarly = 9
}

export const bookingStatusToNumeric = (status: BookingStatus): BookingStatusNumeric => {
    const mapping: Record<BookingStatus, BookingStatusNumeric> = {
        [BookingStatus.Pending]: BookingStatusNumeric.Pending,
        [BookingStatus.Planning]: BookingStatusNumeric.Planning,
        [BookingStatus.Approved]: BookingStatusNumeric.Approved,
        [BookingStatus.Rejected]: BookingStatusNumeric.Rejected,
        [BookingStatus.Cancelled]: BookingStatusNumeric.Cancelled,
        [BookingStatus.Picked]: BookingStatusNumeric.Picked,
        [BookingStatus.ReturnRequested]: BookingStatusNumeric.ReturnRequested,
        [BookingStatus.ReturnEarlyRequested]: BookingStatusNumeric.ReturnEarlyRequested,
        [BookingStatus.Returned]: BookingStatusNumeric.Returned,
        [BookingStatus.ReturnedEarly]: BookingStatusNumeric.ReturnedEarly
    };
    return mapping[status];
};

export const numericToBookingStatus = (status: BookingStatusNumeric): BookingStatus => {
    const mapping: Record<BookingStatusNumeric, BookingStatus> = {
        [BookingStatusNumeric.Pending]: BookingStatus.Pending,
        [BookingStatusNumeric.Planning]: BookingStatus.Planning,
        [BookingStatusNumeric.Approved]: BookingStatus.Approved,
        [BookingStatusNumeric.Rejected]: BookingStatus.Rejected,
        [BookingStatusNumeric.Cancelled]: BookingStatus.Cancelled,
        [BookingStatusNumeric.Picked]: BookingStatus.Picked,
        [BookingStatusNumeric.ReturnRequested]: BookingStatus.ReturnRequested,
        [BookingStatusNumeric.ReturnEarlyRequested]: BookingStatus.ReturnEarlyRequested,
        [BookingStatusNumeric.Returned]: BookingStatus.Returned,
        [BookingStatusNumeric.ReturnedEarly]: BookingStatus.ReturnedEarly
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
    returnRequestType?: number | null;
    returnRequestedEndDateTime?: string | null;
    returnPhotoUrl?: string | null;
    pickedAt?: string | null;
    returnedAt?: string | null;
    createdAt: string;
    updatedAt?: string;
    equipment?: Equipment;
    user?: User;
}

export interface CreateBookingDto {
    equipmentId: string;
    startDateTime: string;
    endDateTime: string;
    notes?: string;
}

export interface UpdateBookingDto {
    startDateTime?: string;
    endDateTime?: string;
    status?: BookingStatus;
    notes?: string;
}

export interface SubmitBookingReturnRequestDto {
    isEarlyReturn: boolean;
    requestedEndDateTime?: string;
    photo?: File | Blob | { uri: string; name: string; type: string } | null;
}