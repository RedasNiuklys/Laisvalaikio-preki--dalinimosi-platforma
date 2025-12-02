import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { Booking, BookingStatus } from '../types/Booking';
import { useTranslation } from 'react-i18next';
import { showToast } from './Toast';

interface BookingsCalendarProps {
    bookings: Booking[];
    onDayPress?: (date: DateData) => void;
}

interface MarkedDate {
    dots?: Array<{ key: string; color: string }>;
    marked?: boolean;
    startingDay?: boolean;
    endingDay?: boolean;
    color?: string;
    disabled?: boolean;
    disableTouchEvent?: boolean;
    textColor?: string;
}

interface MarkedDates {
    [date: string]: MarkedDate;
}

const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
        case BookingStatus.Pending:
            return '#FFA726'; // Orange
        case BookingStatus.Approved:
            return '#66BB6A'; // Green
        case BookingStatus.Rejected:
            return '#EF5350'; // Red
        case BookingStatus.Cancelled:
            return '#9E9E9E'; // Grey
        default:
            return '#9E9E9E';
    }
};

export default function BookingsCalendar({ bookings, onDayPress }: BookingsCalendarProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const handleDayPress = (day: DateData) => {
        // Check if the date is blocked (has an approved booking)
        const isBlocked = bookings.some(booking => {
            if (booking.status === BookingStatus.Approved) {
                const startDate = new Date(booking.startDateTime);
                const endDate = new Date(booking.endDateTime);
                const selectedDate = new Date(day.dateString);
                return selectedDate >= startDate && selectedDate <= endDate;
            }
            return false;
        });

        if (isBlocked) {
            showToast('error', t('booking.errors.dateBlocked'));
            return;
        }

        onDayPress?.(day);
    };

    // Create marked dates object for the calendar
    const markedDates = bookings.reduce((acc: MarkedDates, booking) => {
        const startDate = new Date(booking.startDateTime);
        const endDate = new Date(booking.endDateTime);
        const color = getStatusColor(booking.status);
        const isApproved = booking.status === BookingStatus.Approved;

        // Loop through all dates between start and end
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];

            const isStartDate = currentDate.getTime() === startDate.getTime();
            const isEndDate = currentDate.getTime() === endDate.getTime();

            // If date already marked, merge the dots
            if (acc[dateString]) {
                acc[dateString] = {
                    ...acc[dateString],
                    dots: [...(acc[dateString].dots || []), { color, key: booking.id }],
                    marked: true,
                    color: color + '20',
                    startingDay: acc[dateString].startingDay || isStartDate,
                    endingDay: acc[dateString].endingDay || isEndDate,
                    disabled: acc[dateString].disabled || isApproved,
                    disableTouchEvent: acc[dateString].disableTouchEvent || isApproved,
                    textColor: isApproved ? theme.colors.onSurfaceDisabled : undefined
                };
            } else {
                acc[dateString] = {
                    dots: [{ color, key: booking.id }],
                    marked: true,
                    color: isApproved ? color + '40' : color + '20',
                    startingDay: isStartDate,
                    endingDay: isEndDate,
                    disabled: isApproved,
                    disableTouchEvent: isApproved,
                    textColor: isApproved ? theme.colors.onSurfaceDisabled : undefined
                };
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return acc;
    }, {});

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <Calendar
                markingType="period"
                markedDates={markedDates}
                onDayPress={handleDayPress}
                theme={{
                    calendarBackground: theme.colors.surface,
                    textSectionTitleColor: theme.colors.onSurface,
                    selectedDayBackgroundColor: theme.colors.primary,
                    selectedDayTextColor: theme.colors.onPrimary,
                    todayTextColor: theme.colors.primary,
                    dayTextColor: theme.colors.onSurface,
                    textDisabledColor: theme.colors.onSurfaceDisabled,
                    dotColor: theme.colors.primary,
                    monthTextColor: theme.colors.onSurface,
                    textMonthFontWeight: 'bold',
                    arrowColor: theme.colors.primary,
                    indicatorColor: theme.colors.primary,
                    textDayFontFamily: theme.fonts.bodyMedium.fontFamily,
                    textMonthFontFamily: theme.fonts.titleMedium.fontFamily,
                    textDayHeaderFontFamily: theme.fonts.bodyMedium.fontFamily,
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                }}
            />
            <View style={styles.legend}>
                {Object.values(BookingStatus).map((status) => (
                    <View key={status} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: getStatusColor(status as BookingStatus) }]} />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                            {t(`booking.calendar.legend.${status.toLowerCase()}`)}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 12,
        flexWrap: 'wrap',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
}); 