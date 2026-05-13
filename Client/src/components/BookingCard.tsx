import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '../types/Booking';

interface BookingCardProps {
    booking: Booking;
}

const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
        case BookingStatus.Pending:
        case BookingStatus.ReturnRequested:
        case BookingStatus.ReturnEarlyRequested:
            return '#FFA726';
        case BookingStatus.Approved:
        case BookingStatus.Picked:
            return '#42A5F5';
        case BookingStatus.Returned:
        case BookingStatus.ReturnedEarly:
            return '#66BB6A';
        case BookingStatus.Rejected:
            return '#EF5350';
        case BookingStatus.Cancelled:
            return '#9E9E9E';
        default:
            return '#9E9E9E';
    }
};

export default function BookingCard({ booking }: BookingCardProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    const startDate = new Date(booking.startDateTime);
    const endDate = new Date(booking.endDateTime);

    return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
            <Card.Content>
                <View style={styles.header}>
                    <View style={styles.dateContainer}>
                        <MaterialCommunityIcons
                            name="calendar-range"
                            size={20}
                            color={theme.colors.primary}
                            style={styles.icon}
                        />
                        <View>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                {startDate.toISOString().substring(0, 10)} - {endDate.toISOString().substring(0, 10)}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(booking.status) + '20' }
                        ]}>
                        <Text
                            variant="labelMedium"
                            style={[styles.statusBadgeText, { color: getStatusColor(booking.status) }]}
                        >
                            {t(`booking.status.${booking.status.toString().toLowerCase()}`)}
                        </Text>
                    </View>
                </View>

                {booking.notes && (
                    <View style={styles.notesContainer}>
                        <MaterialCommunityIcons
                            name="note-text-outline"
                            size={20}
                            color={theme.colors.primary}
                            style={styles.icon}
                        />
                        <Text
                            variant="bodyMedium"
                            style={[styles.notes, { color: theme.colors.onSurfaceVariant }]}
                        >
                            {booking.notes}
                        </Text>
                    </View>
                )}

                {booking.user && (
                    <View style={styles.userContainer}>
                        <MaterialCommunityIcons
                            name="account"
                            size={20}
                            color={theme.colors.primary}
                            style={styles.icon}
                        />
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {booking.user.firstName} {booking.user.lastName}
                        </Text>
                    </View>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        minWidth: 0,
        marginRight: 8,
    },
    icon: {
        marginRight: 8,
        marginTop: 2,
    },
    statusBadge: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        maxWidth: '35%',
        marginLeft: 'auto',
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        textAlign: 'left',
    },
    notesContainer: {
        flexDirection: 'row',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    notes: {
        flex: 1,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
}); 