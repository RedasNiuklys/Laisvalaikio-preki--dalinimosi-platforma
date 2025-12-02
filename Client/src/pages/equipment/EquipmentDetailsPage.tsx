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
import { Booking } from '../../types/Booking';
import { getBookingsForEquipment, createBooking } from '../../api/bookingApi';
import { deleteEquipment } from '../../api/equipmentApi';
import BookingModal from "@/src/components/BookingModal";
import BookingCard from "@/src/components/BookingCard";

export default function EquipmentDetailsPage({ id }: { id: string }) {
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        fetchEquipmentDetails();
        const loadBookings = async () => {
            console.log("Loading bookings for equipment:", id);
            if (equipment?.id) {
                const data = await getBookingsForEquipment(equipment.id);
                console.log("Bookings loaded:", data);
                setBookings(data);
            }
        };
        loadBookings();
    }, [id]);

    const fetchEquipmentDetails = async () => {
        try {
            setLoading(true);
            const data = await equipmentApi.getById(id as string);
            console.log("Equipment details:", data);
            setEquipment(data);
        } catch (error) {
            console.error("Error fetching equipment details:", error);
            showToast("error", t("equipment.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!equipment) return;

        try {
            await deleteEquipment(equipment.id);
            router.push('/equipment');
        } catch (error) {
            console.error('Error deleting equipment:', error);
            // You might want to show an error message to the user here
        }
    };

    const handleCreateBooking = async (startDate: Date, endDate: Date, notes: string) => {
        if (!equipment) return;

        try {
            const newBooking = {
                equipmentId: equipment.id,
                startDateTime: startDate.toISOString(),
                endDateTime: endDate.toISOString(),
                status: 'Pending',
                notes: notes.trim()
            };

            await createBooking(newBooking);
            await fetchEquipmentDetails(); // Refresh equipment details
            showToast("success", t("booking.success"));
        } catch (error) {
            console.error("Error creating booking:", error);
            showToast("error", t("booking.error"));
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
                                    {equipment.images.map((image, index) => (
                                        <Image
                                            key={image.id}
                                            source={{ uri: image.url }}
                                            style={styles.image}
                                        />
                                    ))}
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
                                    {equipment && equipment.ownerId !== user?.id && (
                                        <Button
                                            mode="contained-tonal"
                                            onPress={() => setShowBookingModal(true)}
                                            icon="plus"
                                        >
                                            {t("booking.create")}
                                        </Button>
                                    )}
                                </View>
                                {bookings && bookings.length > 0 ? (
                                    <View style={styles.bookingsList}>
                                        {bookings.map((booking) => (
                                            <BookingCard key={booking.id} booking={booking} />
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={{ color: theme.colors.onSurface }}>{t('booking.noBookings')}</Text>
                                )}
                            </Card.Content>
                        </Card>

                        {user?.id === equipment.ownerId && (
                            <View style={styles.actions}>
                                <Button
                                    mode="contained"
                                    onPress={() => router.push(`/equipment/edit/${equipment.id}`)}
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
    bookingsList: {
        marginTop: 12,
    },
}); 