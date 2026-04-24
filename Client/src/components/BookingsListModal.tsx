import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, useTheme, IconButton, Button, ActivityIndicator, Chip, Switch } from 'react-native-paper';
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
    initialBookingId?: string;
    onStatusChange?: (bookingId: string, newStatus: BookingStatus) => Promise<void>;
}

export default function BookingsListModal({
    visible,
    onDismiss,
    bookings,
    equipmentName,
    equipmentOwnerId,
    initialBookingId,
    onStatusChange
}: BookingsListModalProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const { user, loadUser } = useAuth();
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<BookingStatus[]>([]);
    const [hidePastBookings, setHidePastBookings] = useState(true);
    const [activeBookingId, setActiveBookingId] = useState<string | undefined>(initialBookingId);
    const hasLoadedForOpenRef = useRef(false);
    const loadUserRef = useRef(loadUser);

    useEffect(() => {
        loadUserRef.current = loadUser;
    }, [loadUser]);

    useEffect(() => {
        setActiveBookingId(initialBookingId);
    }, [initialBookingId, visible]);

    useEffect(() => {
        if (!visible) {
            hasLoadedForOpenRef.current = false;
            setIsLoadingUser(false);
            return;
        }

        if (hasLoadedForOpenRef.current) {
            return;
        }

        hasLoadedForOpenRef.current = true;
        setIsLoadingUser(true);

        const loadCurrentUser = async () => {
            try {
                await loadUserRef.current();
            } finally {
                setIsLoadingUser(false);
            }
        };

        loadCurrentUser();
    }, [visible]);

    const isOwner = user?.id === equipmentOwnerId;
    console.log('User ID:', user?.id);
    console.log('Equipment Owner ID:', equipmentOwnerId);
    console.log('Is Owner:', isOwner);

    const toggleStatus = (status: BookingStatus) => {
        setSelectedStatuses((current) =>
            current.includes(status)
                ? current.filter((item) => item !== status)
                : [...current, status]
        );
    };

    const filteredBookings = bookings.filter((booking) => {
        if (activeBookingId && booking.id !== activeBookingId) {
            return false;
        }

        if (isOwner && selectedStatuses.length > 0 && !selectedStatuses.includes(booking.status)) {
            return false;
        }

        if (isOwner && hidePastBookings) {
            const bookingEnd = new Date(booking.endDateTime);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            if (bookingEnd < todayStart) {
                return false;
            }
        }

        return true;
    });

    const clearFilters = () => {
        setSelectedStatuses([]);
        setHidePastBookings(true);
        setActiveBookingId(undefined);
    };

    const renderStatusActions = (booking: Booking) => {
        if (!onStatusChange) return null;
        const isBookingCreator = booking.userId === user?.id;

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
                // Non-owner actions (only for their own bookings)
                if (!isBookingCreator) {
                    return [];
                }
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

                {(isOwner || activeBookingId) && (
                    <View style={styles.filtersHeader}>
                        <Button mode="outlined" onPress={() => setShowFilters((prev) => !prev)}>
                            {t('booking.filters.button')}
                        </Button>
                        {(activeBookingId || selectedStatuses.length > 0 || hidePastBookings) && (
                            <Button mode="text" onPress={clearFilters}>
                                {t('booking.filters.clear')}
                            </Button>
                        )}
                    </View>
                )}

                {showFilters && (
                    <View style={[styles.filtersPanel, { backgroundColor: theme.colors.surfaceVariant }]}> 
                        {activeBookingId && (
                            <View style={styles.filterSection}>
                                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                    {t('booking.filters.specificBooking')}
                                </Text>
                                <Button mode="text" onPress={() => setActiveBookingId(undefined)}>
                                    {t('booking.filters.showAll')}
                                </Button>
                            </View>
                        )}

                        {isOwner && (
                            <>
                                <Text style={[styles.filterLabel, { color: theme.colors.onSurfaceVariant }]}>
                                    {t('booking.filters.statusTitle')}
                                </Text>
                                <View style={styles.statusChips}>
                                    {Object.values(BookingStatus).map((status) => (
                                        <Chip
                                            key={status}
                                            selected={selectedStatuses.includes(status)}
                                            onPress={() => toggleStatus(status)}
                                            style={styles.filterChip}
                                        >
                                            {t(`booking.status.${status.toLowerCase()}`)}
                                        </Chip>
                                    ))}
                                </View>

                                <View style={styles.switchRow}>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                        {t('booking.filters.hidePast')}
                                    </Text>
                                    <Switch value={hidePastBookings} onValueChange={setHidePastBookings} />
                                </View>
                            </>
                        )}
                    </View>
                )}

                <ScrollView style={styles.content}>
                    {isLoadingUser ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" />
                        </View>
                    ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <View key={booking.id} style={styles.bookingContainer}>
                                <BookingCard booking={booking} />
                                {renderStatusActions(booking)}
                            </View>
                        ))
                    ) : (
                        <Text style={{ color: theme.colors.onSurface }}>
                            {t(activeBookingId || selectedStatuses.length > 0 || hidePastBookings ? 'booking.filters.noResults' : 'booking.noBookings')}
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
    filtersHeader: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filtersPanel: {
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 12,
        borderRadius: 12,
    },
    filterSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    filterLabel: {
        marginBottom: 8,
    },
    statusChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    filterChip: {
        marginRight: 4,
        marginBottom: 4,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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