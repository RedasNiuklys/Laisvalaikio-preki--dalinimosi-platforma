import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, Image, Platform } from "react-native";
import {
    Text,
    Card,
    useTheme,
    Button,
    ActivityIndicator,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import axios, { isAxiosError } from "axios";
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
import { BASE_URL } from "@/src/utils/envConfig";
import { getAuthToken } from "@/src/utils/authUtils";
import { chatService } from "@/src/services/ChatService";
import { getUserById } from "@/src/api/userApi";
import i18n from "@/src/i18n";
import { getCategoryLabel } from "@/src/utils/categoryUtils";

type EquipmentDetailsPageProps = {
    id: string;
    openBookingsListOnLoad?: boolean;
    initialBookingId?: string;
};

export default function EquipmentDetailsPage({
    id,
    openBookingsListOnLoad = false,
    initialBookingId,
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
    const [ownerDisplayName, setOwnerDisplayName] = useState("");
    const isMountedRef = useRef(true);
    const isNative = Platform.OS !== "web";


    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const resolveOwnerDisplayName = useCallback(async (ownerId: string) => {
        if (user?.id === ownerId) {
            const currentUserName = [user.firstName, user.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
            if (isMountedRef.current) {
                setOwnerDisplayName(currentUserName || user.userName || "You");
            }
            return;
        }

        try {
            const owner = await getUserById(ownerId);
            const fullName = [owner?.firstName, owner?.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
            if (isMountedRef.current) {
                setOwnerDisplayName(fullName || owner?.userName || owner?.email || ownerId);
            }
        } catch (error) {
            console.error("Error fetching equipment owner details:", error);
            if (isMountedRef.current) {
                setOwnerDisplayName(ownerId);
            }
        }
    }, [user?.id, user?.firstName, user?.lastName, user?.userName]);

    const loadBookings = useCallback(async (equipmentId: string) => {
        try {
            console.log("Loading bookings for equipment:", equipmentId);
            const data = await getBookingsForEquipment(equipmentId);
            console.log("Bookings loaded:", data);
            if (isMountedRef.current) {
                setBookings(data);
            }
        } catch (error) {
            console.error("Error loading bookings:", error);
            if (isMountedRef.current) {
                showToast("error", t("booking.error"));
            }
        }
    }, [t]);

    const fetchEquipmentDetails = useCallback(async () => {
        try {
            setLoading(true);
            const data = await equipmentApi.getById(id as string);
            console.log("Equipment details:", data);
            console.log("Equipment images from API:", data.images);
            console.log("Image URLs:", data.images?.map((img: any) => ({ id: img.id, imageUrl: img.imageUrl, url: img.url })));
            if (!isMountedRef.current) {
                return;
            }
            setEquipment(data);
            await resolveOwnerDisplayName(data.ownerId);
            // Load bookings right after equipment is loaded
            await loadBookings(data.id);
        } catch (error) {
            console.error("Error fetching equipment details:", error);
            if (isMountedRef.current) {
                showToast("error", t("equipment.errors.fetchFailed"));
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [id, loadBookings, resolveOwnerDisplayName, t]);

    useEffect(() => {
        fetchEquipmentDetails();
    }, [fetchEquipmentDetails]);

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
            router.replace("/(tabs)/equipment");
        } catch (error) {
            console.error('Error deleting equipment:', error);
            if (isAxiosError(error)) {
                const serverMessage = typeof error.response?.data === "string"
                    ? error.response.data
                    : undefined;
                showToast("error", serverMessage || t("equipment.errors.deleteFailed"));
                return;
            }

            showToast("error", t("equipment.errors.deleteFailed"));
        }
    };

    const createOrGetDirectChat = async (ownerId: string): Promise<number> => {
        const token = await getAuthToken();
        const response = await axios.post(
            `${BASE_URL}/chat/create`,
            {
                name: "",
                isGroupChat: false,
                participantIds: [ownerId],
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    };

    const buildBookingNotificationMessage = (equipmentName: string, equipmentId: string, bookingId: string, startDate: Date, endDate: Date, notes: string): string => {
        const starters = [
            t("booking.notifications.starters.directRequest"),
            t("booking.notifications.starters.interested"),
            t("booking.notifications.starters.reachOut"),
        ];
        const conversationStarter = starters[Math.floor(Math.random() * starters.length)];
        const rangeText = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        const notesPart = notes.trim()
            ? `\n${t("booking.notifications.notesPrefix", { notes: notes.trim() })}`
            : "";

        return `${conversationStarter}\n\n${t("booking.notifications.requestSummary", {
            equipmentName,
            range: rangeText,
        })}${notesPart}\n[BOOKINGS_LINK:${equipmentId}:${bookingId}]`;
    };

    const handleCreateBooking = async (startDate: Date, endDate: Date, notes: string, notifyOwner: boolean) => {
        if (!equipment) return;

        try {
            // Server will auto-approve if the user is the owner
            const isOwner = user?.id === equipment.ownerId;

            const normalizedStart = new Date(Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate(),
                0, 0, 0, 0
            ));
            const normalizedEnd = new Date(Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate(),
                23, 59, 59, 999
            ));

            console.log('Creating booking with startDate:', startDate, 'endDate:', endDate, 'notes:', notes, 'isOwner:', isOwner);
            const newBooking = {
                equipmentId: equipment.id,
                startDateTime: normalizedStart.toISOString(),
                endDateTime: normalizedEnd.toISOString(),
                notes: notes.trim()
            };

            const createdBooking = await createBooking(newBooking);

            if (notifyOwner && !isOwner) {
                try {
                    const chatId = await createOrGetDirectChat(equipment.ownerId);
                    const message = buildBookingNotificationMessage(
                        equipment.name,
                        equipment.id,
                        createdBooking.id,
                        startDate,
                        endDate,
                        notes
                    );
                    await chatService.sendMessage(chatId, message);
                } catch (notifyError) {
                    console.error("Failed to notify owner via chat:", notifyError);
                    showToast("info", t("booking.notifications.sendFailed"));
                }
            }

            // Reload bookings after creating a new one
            await loadBookings(equipment.id);
            showToast("success", isOwner ? t("booking.ownerSuccess") : t("booking.doneSuccess"));
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
                                    <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>{t("equipment.details.category")}: {getCategoryLabel(equipment.category, t)}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons
                                        name="account"
                                        size={20}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>{t("equipment.details.owner")}: {ownerDisplayName}</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Card.Content>
                                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                    {t("equipment.details.location")}
                                </Text>
                                {isNative ? (
                                    <Button
                                        mode="outlined"
                                        icon="map"
                                        onPress={() =>
                                            router.push({
                                                pathname: "/map" as any,
                                                params: {
                                                    category: equipment.category?.slug || "",
                                                },
                                            })
                                        }
                                        style={styles.openMapButton}
                                    >
                                        {t("location.showMap")}
                                    </Button>
                                ) : (
                                    <View style={styles.mapContainer}>
                                        <LocationMap
                                            key={`location-map-${i18n.language}`}
                                            locations={[equipment.location]}
                                            selectedLocation={equipment.location}
                                            onLocationSelect={() => { }}
                                            onLocationClick={() => { }}
                                            isAddingLocation={false}
                                        />
                                    </View>
                                )}
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
                                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                        {t("booking.title")}
                                    </Text>
                                <View style={styles.sectionHeader}>

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
                initialBookingId={initialBookingId}
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
        justifyContent: 'center',
        alignContent: 'center',
        alignSelf: 'center',
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
    openMapButton: {
        marginBottom: 8,
        alignSelf: "flex-start",
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