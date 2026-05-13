import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Booking, BookingStatus, BookingStatusFiltered } from '../types/Booking';
import { useTranslation } from 'react-i18next';
import { showToast } from './Toast';
import { ltLocale, enLocale } from '../locales/calendarLocales';
import { useSettings } from '../context/SettingsContext';

interface BookingsCalendarProps {
    bookings: Booking[];
    onDayPress?: (date: DateData) => void;
}

interface MarkedDate {
    dots?: { key: string; color: string }[];
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

LocaleConfig.locales['lt'] = ltLocale;
LocaleConfig.locales['en'] = enLocale;

const getLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDateAtLocalMidday = (value: string | Date): Date => {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    date.setHours(12, 0, 0, 0);
    return date;
};

const getStatusColor = (status: BookingStatus, isDark: boolean): string => {
    switch (status) {
        case BookingStatus.Pending:
        case BookingStatus.ReturnRequested:
        case BookingStatus.ReturnEarlyRequested:
            return isDark ? '#E6A23C' : '#F59E0B';
        case BookingStatus.Approved:
        case BookingStatus.Picked:
            return isDark ? '#60A5FA' : '#2563EB';
        case BookingStatus.Returned:
        case BookingStatus.ReturnedEarly:
            return isDark ? '#34D399' : '#059669';
        case BookingStatus.Rejected:
            return isDark ? '#F87171' : '#DC2626';
        case BookingStatus.Cancelled:
            return isDark ? '#9CA3AF' : '#6B7280';
        default:
            return isDark ? '#9CA3AF' : '#6B7280';
    }
};

const HIDDEN_STATUSES = new Set([
    BookingStatus.Returned,
    BookingStatus.ReturnedEarly,
    BookingStatus.Picked,
]);

export default function BookingsCalendar({ bookings, onDayPress }: BookingsCalendarProps) {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const { settings } = useSettings();

    const visibleBookings = bookings.filter(b => !HIDDEN_STATUSES.has(b.status));

    useEffect(() => {
        LocaleConfig.locales = {};
        LocaleConfig.locales['lt'] = ltLocale;
        LocaleConfig.locales['en'] = enLocale;
        LocaleConfig.defaultLocale = i18n.language || 'en';
    }, [i18n.language]);

    const handleDayPress = (day: DateData) => {
        // Check if the date is blocked (has an approved booking)
        const isBlocked = visibleBookings.some(booking => {
            if (booking.status === BookingStatus.Approved || booking.status === BookingStatus.Picked) {
                const startDate = getDateAtLocalMidday(booking.startDateTime);
                const endDate = getDateAtLocalMidday(booking.endDateTime);
                const selectedDate = getDateAtLocalMidday(day.dateString);
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
    const markedDates = visibleBookings.reduce((acc: MarkedDates, booking) => {
        const startDate = getDateAtLocalMidday(booking.startDateTime);
        const endDate = getDateAtLocalMidday(booking.endDateTime);
        const color = getStatusColor(booking.status, theme.dark);
        const isApproved = booking.status === BookingStatus.Approved || booking.status === BookingStatus.Picked;

        // Loop through all dates between start and end
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateString = getLocalDateKey(currentDate);

            const isStartDate = dateString === getLocalDateKey(startDate);
            const isEndDate = dateString === getLocalDateKey(endDate);

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
            currentDate.setHours(12, 0, 0, 0);
        }

        return acc;
    }, {});

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <Calendar
                key={`bookings-calendar-${i18n.language}-${theme.dark ? 'dark' : 'light'}`}
                markingType="period"
                markedDates={markedDates}
                onDayPress={handleDayPress}
                firstDay={settings.startWeekOnMonday ? 1 : 0}
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
                {Object.values(BookingStatusFiltered).map((status) => (
                    <View key={status} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: getStatusColor(status as unknown as BookingStatus, theme.dark) }]} />
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
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 12,
        flexWrap: 'wrap',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        gap: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
}); 