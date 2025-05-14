import axios from 'axios';
import { Booking, CreateBookingDto, UpdateBookingDto } from '../types/Booking';
import { getAuthToken } from '../utils/authUtils';
import { BOOKING_ENDPOINT } from '../utils/envConfig';

export const getBookingsForEquipment = async (equipmentId: string): Promise<Booking[]> => {
    const token = await getAuthToken();

    const response = await axios.get(`${BOOKING_ENDPOINT}/equipment/${equipmentId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    console.log("Bookings for equipment:", response.data);
    return response.data;
};

export const getBookingsForUser = async (userId: string): Promise<Booking[]> => {
    const token = await getAuthToken();

    const response = await axios.get(`${BOOKING_ENDPOINT}/user/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const createBooking = async (booking: CreateBookingDto): Promise<Booking> => {
    const token = await getAuthToken();

    const response = await axios.post(`${BOOKING_ENDPOINT}`, booking, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const updateBooking = async (id: string, booking: UpdateBookingDto): Promise<Booking> => {
    const token = await getAuthToken();

    const response = await axios.put(`${BOOKING_ENDPOINT}/${id}`, booking, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const deleteBooking = async (id: string): Promise<void> => {
    const token = await getAuthToken();

    await axios.delete(`${BOOKING_ENDPOINT}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const checkAvailability = async (
    equipmentId: string,
    startDate: string,
    endDate: string
): Promise<boolean> => {
    const token = await getAuthToken();

    const response = await axios.get(`${BOOKING_ENDPOINT}/check-availability`, {
        params: {
            equipmentId,
            startDate,
            endDate
        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}; 