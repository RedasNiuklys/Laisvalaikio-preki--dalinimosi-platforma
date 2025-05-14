import { Equipment } from './Equipment';
import { User } from './User';

export enum BookingStatus {
    Pending = 'Pending',
    Planning = 'Planning',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Cancelled = 'Cancelled'
}

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
    status: string;
    notes?: string;
}

export interface UpdateBookingDto {
    startDateTime?: string;
    endDateTime?: string;
    status?: string;
    notes?: string;
} 