import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { Modal, Portal, Text, useTheme, IconButton, Button, ActivityIndicator, Chip, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Booking, BookingStatus } from '../types/Booking';
import BookingCard from './BookingCard';
import { useAuth } from '../context/AuthContext';
import { approveReturnRequest, rejectReturnRequest, submitBookingReturnRequest } from '../api/bookingApi';
import * as ImagePicker from 'expo-image-picker';

interface BookingsListModalProps {
    visible: boolean;
    onDismiss: () => void;
    bookings: Booking[];
    equipmentName: string;
    equipmentOwnerId?: string;
    initialBookingId?: string;
    onStatusChange?: (bookingId: string, newStatus: BookingStatus) => Promise<void>;
    onRefresh?: () => Promise<void>;
}

export default function BookingsListModal({
    visible,
    onDismiss,
    bookings,
    equipmentName,
    equipmentOwnerId,
    initialBookingId,
    onStatusChange,
    onRefresh
}: BookingsListModalProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const { user, loadUser } = useAuth();
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<BookingStatus[]>([]);
    const [hidePastBookings, setHidePastBookings] = useState(true);
    const [activeBookingId, setActiveBookingId] = useState<string | undefined>(initialBookingId);
    const [showReturnRequestModal, setShowReturnRequestModal] = useState(false);
    const [returnRequestBooking, setReturnRequestBooking] = useState<Booking | null>(null);
    const [returnRequestEarly, setReturnRequestEarly] = useState(false);
    const [returnPhoto, setReturnPhoto] = useState<File | Blob | { uri: string; name: string; type: string } | null>(null);
    const [returnPhotoName, setReturnPhotoName] = useState<string | null>(null);
    const [isSubmittingReturnRequest, setIsSubmittingReturnRequest] = useState(false);
    const [showReturnPhotoModal, setShowReturnPhotoModal] = useState(false);
    const [returnPhotoPreviewUrl, setReturnPhotoPreviewUrl] = useState<string | null>(null);
    const hasLoadedForOpenRef = useRef(false);
    const loadUserRef = useRef(loadUser);
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        loadUserRef.current = loadUser;
    }, [loadUser]);

    useEffect(() => {
        setActiveBookingId(initialBookingId);
    }, [initialBookingId, visible]);

    useEffect(() => {
        if (!visible) {
            hasLoadedForOpenRef.current = false;
            if (isMountedRef.current) {
                setIsLoadingUser(false);
            }
            return;
        }

        if (hasLoadedForOpenRef.current) {
            return;
        }

        if (user) {
            hasLoadedForOpenRef.current = true;
            if (isMountedRef.current) {
                setIsLoadingUser(false);
            }
            return;
        }

        hasLoadedForOpenRef.current = true;
        if (isMountedRef.current) {
            setIsLoadingUser(true);
        }

        const loadCurrentUser = async () => {
            try {
                await loadUserRef.current();
            } finally {
                if (isMountedRef.current) {
                    setIsLoadingUser(false);
                }
            }
        };

        loadCurrentUser();
    }, [user, visible]);

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

    const refreshBookings = async () => {
        if (onRefresh) {
            await onRefresh();
        }
    };

    const handleStatusAction = async (bookingId: string, newStatus: BookingStatus) => {
        if (onStatusChange) {
            await onStatusChange(bookingId, newStatus);
        }
        await refreshBookings();
    };

    const handleReturnRequest = async (booking: Booking, isEarlyReturn: boolean) => {
        setReturnRequestBooking(booking);
        setReturnRequestEarly(isEarlyReturn);
        setReturnPhoto(null);
        setReturnPhotoName(null);
        setShowReturnRequestModal(true);
    };

    const pickReturnPhoto = async () => {
        try {
            if (Platform.OS !== 'web') {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert(t('common.status.error'), t('profile.permissions.message'));
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images' as any,
                allowsEditing: false,
                quality: 0.7,
            });

            if (result.canceled || !result.assets?.length) {
                return;
            }

            const asset = result.assets[0];
            const defaultName = `return-${Date.now()}.jpg`;
            const fileName = asset.fileName || defaultName;
            const mimeType = asset.mimeType || 'image/jpeg';

            if (Platform.OS === 'web' && (asset as any).file) {
                setReturnPhoto((asset as any).file as File);
            } else {
                setReturnPhoto({
                    uri: asset.uri,
                    name: fileName,
                    type: mimeType,
                });
            }

            setReturnPhotoName(fileName);
        } catch (error) {
            console.error('Failed to pick return photo:', error);
            Alert.alert(t('common.status.error'), t('booking.actions.statusError'));
        }
    };

    const submitReturnRequestFromForm = async () => {
        if (!returnRequestBooking) {
            return;
        }

        try {
            setIsSubmittingReturnRequest(true);
            await submitBookingReturnRequest(returnRequestBooking.id, {
                isEarlyReturn: returnRequestEarly,
                requestedEndDateTime: returnRequestEarly ? new Date().toISOString() : undefined,
                photo: returnPhoto,
            });

            setShowReturnRequestModal(false);
            setReturnRequestBooking(null);
            setReturnPhoto(null);
            setReturnPhotoName(null);
        } finally {
            setIsSubmittingReturnRequest(false);
        }

        await refreshBookings();
    };

    const handleReturnDecision = async (bookingId: string, approve: boolean) => {
        if (approve) {
            await approveReturnRequest(bookingId);
        } else {
            await rejectReturnRequest(bookingId);
        }
        await refreshBookings();
    };

    const openReturnPhotoModal = (photoUrl: string) => {
        setReturnPhotoPreviewUrl(photoUrl);
        setShowReturnPhotoModal(true);
    };

    const renderStatusActions = (booking: Booking) => {
        const isBookingCreator = booking.userId === user?.id;
        const actions: { key: string; label: string; color: string; onPress: () => Promise<void> }[] = [];

        if (isOwner) {
            if (booking.status === BookingStatus.Pending) {
                actions.push(
                    {
                        key: 'approve',
                        label: t('booking.actions.approve'),
                        color: theme.colors.primary,
                        onPress: async () => handleStatusAction(booking.id, BookingStatus.Approved)
                    },
                    {
                        key: 'reject',
                        label: t('booking.actions.reject'),
                        color: theme.colors.error,
                        onPress: async () => handleStatusAction(booking.id, BookingStatus.Rejected)
                    }
                );
            }

            if (booking.status === BookingStatus.Approved) {
                actions.push({
                    key: 'cancel',
                    label: t('booking.actions.cancel'),
                    color: theme.colors.error,
                    onPress: async () => handleStatusAction(booking.id, BookingStatus.Cancelled)
                });
            }

            if (booking.status === BookingStatus.ReturnRequested || booking.status === BookingStatus.ReturnEarlyRequested) {
                actions.push(
                    {
                        key: 'approve-return',
                        label: t('booking.actions.approveReturn'),
                        color: theme.colors.primary,
                        onPress: async () => handleReturnDecision(booking.id, true)
                    },
                    {
                        key: 'reject-return',
                        label: t('booking.actions.rejectReturn'),
                        color: theme.colors.error,
                        onPress: async () => handleReturnDecision(booking.id, false)
                    }
                );
            }
        } else if (isBookingCreator) {
            if (booking.status === BookingStatus.Planning) {
                actions.push({
                    key: 'submit',
                    label: t('booking.actions.submit'),
                    color: theme.colors.primary,
                    onPress: async () => handleStatusAction(booking.id, BookingStatus.Pending)
                });
            }

            if (booking.status === BookingStatus.Approved) {
                actions.push({
                    key: 'picked',
                    label: t('booking.actions.pickUp'),
                    color: theme.colors.primary,
                    onPress: async () => handleStatusAction(booking.id, BookingStatus.Picked)
                });
            }

            if (booking.status === BookingStatus.Picked) {
                const now = new Date();
                const bookingEndDate = new Date(booking.endDateTime);
                const shouldShowEarlyReturn = now < bookingEndDate;

                if (shouldShowEarlyReturn) {
                    actions.push({
                        key: 'early-return',
                        label: t('booking.actions.requestEarlyReturn'),
                        color: theme.colors.secondary,
                        onPress: async () => handleReturnRequest(booking, true)
                    });
                } else {
                    actions.push({
                        key: 'return',
                        label: t('booking.actions.requestReturn'),
                        color: theme.colors.primary,
                        onPress: async () => handleReturnRequest(booking, false)
                    });
                }
            }
        }

        if ((isOwner || isBookingCreator) && booking.returnPhotoUrl) {
            actions.push({
                key: `view-return-photo-${booking.id}`,
                label: t('booking.actions.viewReturnPhoto'),
                color: theme.colors.tertiary,
                onPress: async () => {
                    openReturnPhotoModal(booking.returnPhotoUrl!);
                }
            });
        }

        if (actions.length === 0) return null;

        return (
            <View style={styles.actionButtons}>
                {actions.map((action) => (
                    <Button
                        key={action.key}
                        mode="contained"
                        onPress={() => void action.onPress()}
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

            <Modal
                visible={showReturnRequestModal}
                onDismiss={() => setShowReturnRequestModal(false)}
                contentContainerStyle={[
                    styles.returnRequestModal,
                    { backgroundColor: theme.colors.background }
                ]}
            >
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
                    {returnRequestEarly ? t('booking.actions.requestEarlyReturn') : t('booking.actions.requestReturn')}
                </Text>

                <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                    {t('booking.actions.returnPhotoHint')}
                </Text>

                <Button mode="outlined" onPress={() => void pickReturnPhoto()}>
                    {t('booking.actions.selectReturnPhoto')}
                </Button>

                {returnPhotoName && (
                    <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>
                        {t('booking.actions.selectedPhoto')}: {returnPhotoName}
                    </Text>
                )}

                <View style={styles.returnRequestActions}>
                    <Button onPress={() => setShowReturnRequestModal(false)}>
                        {t('booking.actions.cancel')}
                    </Button>
                    <Button
                        mode="contained"
                        loading={isSubmittingReturnRequest}
                        disabled={isSubmittingReturnRequest}
                        onPress={() => void submitReturnRequestFromForm()}
                    >
                        {t('booking.actions.submitReturnRequest')}
                    </Button>
                </View>
            </Modal>

            <Modal
                visible={showReturnPhotoModal}
                onDismiss={() => setShowReturnPhotoModal(false)}
                contentContainerStyle={[
                    styles.returnPhotoModal,
                    { backgroundColor: theme.colors.background }
                ]}
            >
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
                    {t('booking.actions.viewReturnPhoto')}
                </Text>

                {returnPhotoPreviewUrl ? (
                    <Image
                        source={{ uri: returnPhotoPreviewUrl }}
                        style={styles.returnPhotoImage}
                        resizeMode="contain"
                    />
                ) : (
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        {t('booking.actions.statusError')}
                    </Text>
                )}

                <View style={styles.returnRequestActions}>
                    <Button onPress={() => setShowReturnPhotoModal(false)}>
                        {t('booking.actions.cancel')}
                    </Button>
                </View>
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
    returnRequestModal: {
        margin: 20,
        borderRadius: 10,
        padding: 16,
    },
    returnRequestActions: {
        marginTop: 18,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    returnPhotoModal: {
        margin: 20,
        borderRadius: 10,
        padding: 16,
        maxHeight: '80%',
    },
    returnPhotoImage: {
        width: '100%',
        height: 340,
        borderRadius: 10,
        backgroundColor: '#f4f4f4',
    },
}); 