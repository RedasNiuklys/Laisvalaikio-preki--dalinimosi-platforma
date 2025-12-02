import axios from 'axios';
import {
    Booking,
    CreateBookingDto,
    UpdateBookingDto,
    BookingStatus,
    bookingStatusToNumeric,
    numericToBookingStatus,
    BookingStatusNumeric
} from '../types/Booking';
import { getAuthToken } from '../utils/authUtils';
import { BOOKING_ENDPOINT } from '../utils/envConfig';
import { coolDownAsync } from 'expo-web-browser';

export const getBookingsForEquipment = async (equipmentId: string): Promise<Booking[]> => {
    const token = await getAuthToken();

    const response = await axios.get(`${BOOKING_ENDPOINT}/equipment/${equipmentId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Convert numeric status to string enum
    const bookings = response.data.map((booking: any) => ({
        ...booking,
        status: numericToBookingStatus(booking.status as BookingStatusNumeric)
    }));

    console.log("Bookings for equipment:", bookings);
    return bookings;
};

export const getBookingsForUser = async (userId: string): Promise<Booking[]> => {
    const token = await getAuthToken();

    const response = await axios.get(`${BOOKING_ENDPOINT}/user/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Convert numeric status to string enum
    return response.data.map((booking: any) => ({
        ...booking,
        status: numericToBookingStatus(booking.status as BookingStatusNumeric)
    }));
};

export const createBooking = async (booking: CreateBookingDto): Promise<Booking> => {
    const token = await getAuthToken();

    const response = await axios.post(`${BOOKING_ENDPOINT}`, {
        ...booking,
        status: booking.status ? bookingStatusToNumeric(booking.status as BookingStatus) : undefined
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Convert numeric status to string enum in response
    return {
        ...response.data,
        status: numericToBookingStatus(response.data.status as BookingStatusNumeric)
    };
};

export const updateBookingStatus = async (id: string, status: BookingStatus): Promise<void> => {
    const token = await getAuthToken();

    await axios.patch(`${BOOKING_ENDPOINT}/${id}/status`,
        status.toString(),
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );
};

export const updateBooking = async (id: string, booking: UpdateBookingDto): Promise<Booking | void> => {
    // If only status is being updated, use the dedicated endpoint
    console.log('Booking:', Object.keys(booking).length);
    console.log('Booking:', booking);

    if (Object.keys(booking).length === 1 && booking.status) {
        await updateBookingStatus(id, booking.status);
        return;
    }

    const token = await getAuthToken();

    const response = await axios.put(`${BOOKING_ENDPOINT}/${id}`, {
        ...booking,
        status: booking.status ? bookingStatusToNumeric(booking.status as BookingStatus) : undefined
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Convert numeric status to string enum in response
    return {
        ...response.data,
        status: numericToBookingStatus(response.data.status as BookingStatusNumeric)
    };
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