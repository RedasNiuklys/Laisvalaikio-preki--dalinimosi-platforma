import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, useTheme, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../types/Booking';
import BookingCard from './BookingCard';
import { useAuth } from '../context/AuthContext';

interface BookingsListModalProps {
    visible: boolean;
    onDismiss: () => void;
    bookings: Booking[];
    equipmentName: string;
    equipmentOwnerId?: string;
    onStatusChange?: (bookingId: string, newStatus: BookingStatus) => Promise<void>;
}

export default function BookingsListModal({
    visible,
    onDismiss,
    bookings,
    equipmentName,
    equipmentOwnerId,
    onStatusChange
}: BookingsListModalProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const { user, loadUser } = useAuth();
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        // Set a timeout to avoid infinite loading state\
        loadUser();
        const timer = setTimeout(() => {
            setIsLoadingUser(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [visible]);

    const isOwner = user?.id === equipmentOwnerId;

    const renderStatusActions = (booking: Booking) => {
        console.log('Current status', onStatusChange);
        if (!onStatusChange) return null;

        const getAvailableActions = (currentStatus: BookingStatus) => {
            console.log('Current status:', currentStatus);
            if (isOwner) {
                switch (currentStatus) {
                    case BookingStatus.Pending:
                        return [
                            { status: BookingStatus.Approved, label: t('booking.actions.approve'), color: theme.colors.primary },
                            { status: BookingStatus.Rejected, label: t('booking.actions.reject'), color: theme.colors.error }
                        ];
                    case BookingStatus.Approved:
                        return [
                            { status: BookingStatus.Cancelled, label: t('booking.actions.cancel'), color: theme.colors.error }
                        ];
                    case BookingStatus.Rejected:
                    case BookingStatus.Cancelled:
                        return [];
                    default:
                        return [];
                }
            } else {
                // Non-owner actions
                switch (currentStatus) {
                    case BookingStatus.Planning:
                        return [
                            { status: BookingStatus.Pending, label: t('booking.actions.submit'), color: theme.colors.primary }
                        ];
                    default:
                        return [];
                }
            }
        };

        const actions = getAvailableActions(booking.status);
        console.log('Actions:', actions);

        if (actions.length === 0) return null;

        return (
            <View style={styles.actionButtons}>
                {actions.map((action) => (
                    <Button
                        key={action.status}
                        mode="contained"
                        onPress={() => onStatusChange && onStatusChange(booking.id, action.status)}
                        style={[styles.actionButton, { backgroundColor: action.color }]}
                        textColor={theme.colors.onPrimary}
                    >
                        {action.label}
                    </Button>
                ))}
            </View>
        );
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.container,
                    { backgroundColor: theme.colors.background }
                ]}
            >
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        onPress={onDismiss}
                        style={styles.backButton}
                    />
                    <Text variant="titleLarge" style={styles.title}>
                        {t('booking.listTitle')}
                    </Text>
                </View>

                <Text variant="titleMedium" style={[styles.equipmentName, { color: theme.colors.onSurface }]}>
                    {equipmentName}
                </Text>

                <ScrollView style={styles.content}>
                    {isLoadingUser ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" />
                        </View>
                    ) : bookings.length > 0 ? (
                        bookings.map((booking) => (
                            <View key={booking.id} style={styles.bookingContainer}>
                                <BookingCard booking={booking} />
                                {renderStatusActions(booking)}
                            </View>
                        ))
                    ) : (
                        <Text style={{ color: theme.colors.onSurface }}>
                            {t('booking.noBookings')}
                        </Text>
                    )}
                </ScrollView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 20,
        borderRadius: 8,
        height: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 8,
    },
    title: {
        flex: 1,
    },
    equipmentName: {
        padding: 16,
        paddingTop: 8,
    },
    content: {
        padding: 16,
    },
    bookingContainer: {
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 8,
    },
    actionButton: {
        minWidth: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
}); 