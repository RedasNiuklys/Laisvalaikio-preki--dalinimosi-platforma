import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import {
    Text,
    Card,
    useTheme,
    Button,
    ActivityIndicator,
    IconButton,
    Divider,
    FAB,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import LocationMap from "@/src/components/LocationMap";
import * as equipmentApi from "@/src/api/equipmentApi";
import { Equipment } from "@/src/types/Equipment";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Booking, BookingStatus } from '../../types/Booking';
import { getBookingsForEquipment, createBooking, updateBooking } from '../../api/bookingApi';
import { deleteEquipment } from '../../api/equipmentApi';
import BookingModal from "@/src/components/BookingModal";
import BookingsCalendar from "@/src/components/BookingsCalendar";
import BookingsListModal from "@/src/components/BookingsListModal";

type EquipmentDetailsPageProps = {
    id: string;
    openBookingsListOnLoad?: boolean;
};

export default function EquipmentDetailsPage({
    id,
    openBookingsListOnLoad = false,
}: EquipmentDetailsPageProps) {
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showBookingsListModal, setShowBookingsListModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [didAutoOpenBookings, setDidAutoOpenBookings] = useState(false);

    const loadBookings = async (equipmentId: string) => {
        try {
            console.log("Loading bookings for equipment:", equipmentId);
            const data = await getBookingsForEquipment(equipmentId);
            console.log("Bookings loaded:", data);
            setBookings(data);
        } catch (error) {
            console.error("Error loading bookings:", error);
            showToast("error", t("booking.error"));
        }
    };

    const fetchEquipmentDetails = async () => {
        try {
            setLoading(true);
            const data = await equipmentApi.getById(id as string);
            console.log("Equipment details:", data);
            console.log("Equipment images from API:", data.images);
            console.log("Image URLs:", data.images?.map((img: any) => ({ id: img.id, imageUrl: img.imageUrl, url: img.url })));
            setEquipment(data);
            // Load bookings right after equipment is loaded
            await loadBookings(data.id);
        } catch (error) {
            console.error("Error fetching equipment details:", error);
            showToast("error", t("equipment.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipmentDetails();
    }, [id]);

    useEffect(() => {
        if (
            openBookingsListOnLoad &&
            !loading &&
            !!equipment &&
            !didAutoOpenBookings
        ) {
            setShowBookingsListModal(true);
            setDidAutoOpenBookings(true);
        }
    }, [openBookingsListOnLoad, loading, equipment, didAutoOpenBookings]);

    const handleDelete = async () => {
        if (!equipment) return;

        try {
            await deleteEquipment(equipment.id);
            router.back();
        } catch (error) {
            console.error('Error deleting equipment:', error);
            // You might want to show an error message to the user here
        }
    };

    const handleCreateBooking = async (startDate: Date, endDate: Date, notes: string) => {
        if (!equipment) return;

        try {
            // Server will auto-approve if the user is the owner
            const isOwner = user?.id === equipment.ownerId;
            console.log('Creating booking with startDate:', startDate, 'endDate:', endDate, 'notes:', notes, 'isOwner:', isOwner);
            const newBooking = {
                equipmentId: equipment.id,
                startDateTime: startDate.toISOString(),
                endDateTime: endDate.toISOString(),
                notes: notes.trim()
            };

            await createBooking(newBooking);
            // Reload bookings after creating a new one
            await loadBookings(equipment.id);
            showToast("success", isOwner ? t("booking.ownerSuccess") : t("booking.success"));
        } catch (error) {
            console.error("Error creating booking:", error);
            showToast("error", t("booking.error"));
        }
    };

    const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
        try {
            console.log('New status:', newStatus);
            await updateBooking(bookingId, { status: newStatus });
            // Refresh bookings after status update
            if (equipment?.id) {
                await loadBookings(equipment.id);
            }
            showToast("success", t("booking.actions.statusChanged"));
        } catch (error) {
            console.error("Error updating booking status:", error);
            showToast("error", t("booking.actions.statusError"));
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!equipment) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
                <Text>{t("equipment.errors.notFound")}</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {equipment && (
                    <>
                        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Card.Content>
                                <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                                    {equipment.name}
                                </Text>
                                <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                                    {equipment.description}
                                </Text>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Card.Content>
                                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                    {t("equipment.details.images")}
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {equipment.images.map((image, index) => {
                                        const imageUri = image.imageUrl || image.url;
                                        if (!imageUri) {
                                            return null;
                                        }

                                        return (
                                            <Image
                                                key={image.id || `${index}-${imageUri}`}
                                                source={{ uri: imageUri }}
                                                style={styles.image}
                                            />
                                        );
                                    })}
                                </ScrollView>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Card.Content>
                                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                    {t("equipment.details.info")}
                                </Text>
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons
                                        name="tag"
                                        size={20}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>{equipment.category.name}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons
                                        name="information"
                                        size={20}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>{equipment.description}</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Card.Content>
                                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                    {t("equipment.details.location")}
                                </Text>
                                <View style={styles.mapContainer}>
                                    <LocationMap
                                        locations={[equipment.location]}
                                        selectedLocation={equipment.location}
                                        onLocationSelect={() => { }}
                                        onLocationClick={() => { }}
                                        isAddingLocation={false}
                                    />
                                </View>
                                <View style={styles.locationInfo}>
                                    <Text style={{ color: theme.colors.onSurface }}>{equipment.location.streetAddress}</Text>
                                    <Text style={{ color: theme.colors.onSurface }}>
                                        {equipment.location.city}, {equipment.location.country}
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Card.Content>
                                <View style={styles.sectionHeader}>
                                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                        {t("booking.title")}
                                    </Text>
                                    <View style={styles.bookingActions}>
                                        <Button
                                            mode="contained-tonal"
                                            onPress={() => {
                                                setSelectedDate(undefined);
                                                setShowBookingModal(true);
                                            }}
                                            icon="plus"
                                            style={styles.bookingButton}
                                        >
                                            {t("booking.create")}
                                        </Button>
                                        <Button
                                            mode="outlined"
                                            onPress={() => setShowBookingsListModal(true)}
                                            icon="format-list-bulleted"
                                        >
                                            {t("booking.viewAll")}
                                        </Button>
                                    </View>
                                </View>

                                <BookingsCalendar
                                    bookings={bookings}
                                    onDayPress={(date) => {
                                        setSelectedDate(new Date(date.dateString));
                                        setShowBookingModal(true);
                                    }}
                                />
                            </Card.Content>
                        </Card>

                        {user?.id === equipment.ownerId && (
                            <View style={styles.actions}>
                                <Button
                                    mode="contained"
                                    onPress={() => router.push({ pathname: "/(modals)/equipment/edit/[id]", params: { id: equipment.id } })}
                                    style={styles.editButton}
                                >
                                    {t("equipment.actions.edit")}
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={handleDelete}
                                    style={styles.deleteButton}
                                >
                                    {t("equipment.actions.delete")}
                                </Button>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <BookingModal
                visible={showBookingModal}
                onDismiss={() => setShowBookingModal(false)}
                onSubmit={handleCreateBooking}
                equipmentName={equipment?.name || ''}
                initialDate={selectedDate}
                isOwner={user?.id === equipment?.ownerId}
            />

            <BookingsListModal
                visible={showBookingsListModal}
                onDismiss={() => setShowBookingsListModal(false)}
                bookings={bookings}
                equipmentName={equipment?.name || ''}
                equipmentOwnerId={equipment?.ownerId}
                onStatusChange={handleStatusChange}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    image: {
        width: 100,
        height: 100,
        marginRight: 8,
    },
    content: {
        padding: 16,
    },
    title: {
        marginBottom: 16,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        flex: 1,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
    },
    mapContainer: {
        height: 200,
        marginBottom: 8,
        borderRadius: 8,
        overflow: "hidden",
    },
    locationInfo: {
        marginTop: 8,
    },
    description: {
        marginBottom: 16,
    },
    actions: {
        marginTop: 16,
    },
    editButton: {
        marginBottom: 16,
    },
    deleteButton: {
        marginLeft: 8,
    },
    bookingActions: {
        flexDirection: 'row',
        gap: 8,
    },
    bookingButton: {
        marginRight: 8,
    },
}); 