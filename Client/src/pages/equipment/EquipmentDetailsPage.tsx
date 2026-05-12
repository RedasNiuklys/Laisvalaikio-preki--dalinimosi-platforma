import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, Image, Platform } from "react-native";
import {
    Text,
    Card,
    useTheme,
    Button,
    ActivityIndicator,
    TextInput,
    Portal,
    Modal,
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
import { createReview, deleteReview, getReviewEligibility, updateReview } from "@/src/api/reviewApi";
import { Review, ReviewEligibility } from "@/src/types/Review";
import Rating from "react-rating";

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
    const WebRating = Rating as any;
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
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editingReviewRating, setEditingReviewRating] = useState(5);
    const [editingReviewComment, setEditingReviewComment] = useState("");
    const [updatingReview, setUpdatingReview] = useState(false);
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [reviewsPage, setReviewsPage] = useState(1);
    const isMountedRef = useRef(true);
    const isNative = Platform.OS !== "web";
    const REVIEWS_PER_PAGE = 3;

    const averageRating = reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
    const totalReviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
    const paginatedReviews = reviews.slice(
        (reviewsPage - 1) * REVIEWS_PER_PAGE,
        reviewsPage * REVIEWS_PER_PAGE
    );

    const getAverageStarIcon = (index: number, rating: number) => {
        if (rating >= index + 1) {
            return "star";
        }

        if (rating > index) {
            return "star-half-full";
        }

        return "star-outline";
    };

    const renderSelectableStars = (
        value: number,
        onChange: (next: number) => void,
        keyPrefix: string
    ) => {
        if (!isNative) {
            return (
                <WebRating
                    initialRating={value}
                    onChange={(nextValue: number) => onChange(Math.max(1, Math.min(5, Math.round(nextValue))))}
                    fractions={1}
                    emptySymbol={<MaterialCommunityIcons name="star-outline" size={24} color={theme.colors.primary} />}
                    fullSymbol={<MaterialCommunityIcons name="star" size={24} color={theme.colors.primary} />}
                />
            );
        }

        return (
            <View style={styles.starRow}>
                {Array.from({ length: 5 }).map((_, index) => {
                    const starValue = index + 1;
                    return (
                        <MaterialCommunityIcons
                            key={`${keyPrefix}-${starValue}`}
                            name={starValue <= value ? "star" : "star-outline"}
                            size={24}
                            color={theme.colors.primary}
                            onPress={() => onChange(starValue)}
                        />
                    );
                })}
            </View>
        );
    };


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
                showToast("error", i18n.t("booking.error"));
            }
        }
    }, []);

    const loadReviewEligibility = useCallback(async (equipmentId: string) => {
        try {
            const data = await getReviewEligibility(equipmentId);
            if (isMountedRef.current) {
                setReviewEligibility(data);
            }
        } catch (error) {
            console.error("Error loading review eligibility:", error);
            if (isMountedRef.current) {
                setReviewEligibility({ canReview: false, reason: "failed" });
            }
        }
    }, []);

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
            setReviews(data.reviews ?? []);

            // Run independent requests in parallel to reduce details page load time.
            await Promise.all([
                resolveOwnerDisplayName(data.ownerId),
                loadBookings(data.id),
                loadReviewEligibility(data.id),
            ]);
        } catch (error) {
            console.error("Error fetching equipment details:", error);
            if (isMountedRef.current) {
                showToast("error", i18n.t("equipment.errors.fetchFailed"));
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [id, loadBookings, loadReviewEligibility, resolveOwnerDisplayName]);

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

    useEffect(() => {
        if (reviewsPage > totalReviewPages) {
            setReviewsPage(totalReviewPages);
        }
    }, [reviewsPage, totalReviewPages]);

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

    const handleCreateReview = async () => {
        if (!equipment || !reviewEligibility?.canReview || !reviewEligibility.eligibleBookingId) {
            return;
        }

        try {
            setSubmittingReview(true);
            await createReview({
                equipmentId: equipment.id,
                bookingId: reviewEligibility.eligibleBookingId,
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
            });

            setReviewComment("");
            setReviewRating(5);
            await fetchEquipmentDetails();
            showToast("success", t("equipment.reviews.submitSuccess"));
        } catch (error) {
            console.error("Error creating review:", error);
            showToast("error", t("equipment.reviews.submitError"));
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleStartEditReview = (review: Review) => {
        setEditingReviewId(review.id);
        setEditingReviewRating(review.rating);
        setEditingReviewComment(review.comment || "");
    };

    const handleCancelEditReview = () => {
        setEditingReviewId(null);
        setEditingReviewRating(5);
        setEditingReviewComment("");
    };

    const handleUpdateReview = async () => {
        if (!editingReviewId) {
            return;
        }

        try {
            setUpdatingReview(true);
            await updateReview(editingReviewId, {
                rating: editingReviewRating,
                comment: editingReviewComment.trim() || undefined,
            });

            handleCancelEditReview();
            await fetchEquipmentDetails();
            showToast("success", t("equipment.reviews.updateSuccess"));
        } catch (error) {
            console.error("Error updating review:", error);
            showToast("error", t("equipment.reviews.updateError"));
        } finally {
            setUpdatingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        try {
            setDeletingReviewId(reviewId);
            await deleteReview(reviewId);
            if (editingReviewId === reviewId) {
                handleCancelEditReview();
            }
            await fetchEquipmentDetails();
            showToast("success", t("equipment.reviews.deleteSuccess"));
        } catch (error) {
            console.error("Error deleting review:", error);
            showToast("error", t("equipment.reviews.deleteError"));
        } finally {
            setDeletingReviewId(null);
        }
    };

    const handleOpenReviewsModal = () => {
        setReviewsPage(1);
        setShowReviewsModal(true);
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

                        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Card.Content>
                                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                    {t("equipment.reviews.title")}
                                </Text>

                                <View style={styles.reviewSummaryRow}>
                                    {!isNative ? (
                                        <WebRating
                                            initialRating={averageRating}
                                            readonly
                                            fractions={10}
                                            emptySymbol={<MaterialCommunityIcons name="star-outline" size={20} color={theme.colors.primary} />}
                                            fullSymbol={<MaterialCommunityIcons name="star" size={20} color={theme.colors.primary} />}
                                        />
                                    ) : (
                                        <View style={styles.starRow}>
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <MaterialCommunityIcons
                                                    key={`avg-star-${index}`}
                                                    name={getAverageStarIcon(index, averageRating)}
                                                    size={20}
                                                    color={theme.colors.primary}
                                                />
                                            ))}
                                        </View>
                                    )}
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                        {reviews.length > 0
                                            ? `${averageRating.toFixed(1)} / 5 (${reviews.length})`
                                            : t("equipment.reviews.noReviews")}
                                    </Text>
                                </View>
                                <Button
                                    mode="outlined"
                                    icon="comment-text-multiple"
                                    onPress={handleOpenReviewsModal}
                                >
                                    {t("equipment.reviews.show")}
                                </Button>
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

            <Portal>
                <Modal
                    visible={showReviewsModal}
                    onDismiss={() => setShowReviewsModal(false)}
                    contentContainerStyle={[
                        styles.reviewsModalContainer,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <View style={styles.reviewsModalHeader}>
                        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                            {t("equipment.reviews.title")}
                        </Text>
                        <Button mode="text" onPress={() => setShowReviewsModal(false)}>
                            {t("equipment.reviews.close")}
                        </Button>
                    </View>

                    <ScrollView style={styles.reviewsModalScroll}>
                        {reviewEligibility?.canReview && user?.id !== equipment?.ownerId && (
                            <View style={styles.reviewFormContainer}>
                                <Text style={[styles.reviewFormLabel, { color: theme.colors.onSurface }]}>
                                    {t("equipment.reviews.yourReview")}
                                </Text>
                                {renderSelectableStars(reviewRating, setReviewRating, "create-rating")}

                                <TextInput
                                    mode="outlined"
                                    multiline
                                    value={reviewComment}
                                    onChangeText={setReviewComment}
                                    placeholder={t("equipment.reviews.commentPlaceholder")}
                                    style={styles.reviewInput}
                                />

                                <Button
                                    mode="contained"
                                    onPress={handleCreateReview}
                                    loading={submittingReview}
                                    disabled={submittingReview}
                                >
                                    {t("equipment.reviews.submit")}
                                </Button>
                            </View>
                        )}

                        {reviewEligibility && !reviewEligibility.canReview && user?.id !== equipment?.ownerId && (
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                {t("equipment.reviews.eligibilityHint")}
                            </Text>
                        )}

                        {paginatedReviews.map((review) => (
                            <View key={review.id} style={styles.reviewItem}>
                                <View style={styles.reviewHeaderRow}>
                                    <View style={styles.reviewAuthorRow}>
                                        <Text style={[styles.reviewAuthor, { color: theme.colors.onSurface }]}>
                                            {`${review.reviewer.firstName || ""} ${review.reviewer.lastName || ""}`.trim() || review.reviewer.userName}
                                        </Text>
                                        {!!review.updatedAt && (
                                            <Text style={[styles.editedTag, { color: theme.colors.primary }]}>
                                                {t("equipment.reviews.edited")}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.starRow}>
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <MaterialCommunityIcons
                                                key={`${review.id}-star-${index}`}
                                                name={index < (editingReviewId === review.id ? editingReviewRating : review.rating) ? "star" : "star-outline"}
                                                size={16}
                                                color={theme.colors.primary}
                                            />
                                        ))}
                                    </View>
                                </View>

                                {editingReviewId === review.id ? (
                                    <>
                                        {renderSelectableStars(editingReviewRating, setEditingReviewRating, `edit-rating-${review.id}`)}
                                        <TextInput
                                            mode="outlined"
                                            multiline
                                            value={editingReviewComment}
                                            onChangeText={setEditingReviewComment}
                                            placeholder={t("equipment.reviews.commentPlaceholder")}
                                            style={styles.reviewInput}
                                        />
                                        <View style={styles.reviewActionRow}>
                                            <Button
                                                mode="contained"
                                                onPress={handleUpdateReview}
                                                loading={updatingReview}
                                                disabled={updatingReview}
                                            >
                                                {t("equipment.reviews.save")}
                                            </Button>
                                            <Button
                                                mode="text"
                                                onPress={handleCancelEditReview}
                                                disabled={updatingReview}
                                            >
                                                {t("equipment.reviews.cancel")}
                                            </Button>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        {!!review.comment && (
                                            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                                {review.comment}
                                            </Text>
                                        )}
                                        {review.userId === user?.id && (
                                            <View style={styles.reviewActionRow}>
                                                <Button mode="text" onPress={() => handleStartEditReview(review)}>
                                                    {t("equipment.reviews.edit")}
                                                </Button>
                                                <Button
                                                    mode="text"
                                                    onPress={() => handleDeleteReview(review.id)}
                                                    loading={deletingReviewId === review.id}
                                                    disabled={deletingReviewId === review.id}
                                                    textColor={theme.colors.error}
                                                >
                                                    {t("equipment.reviews.delete")}
                                                </Button>
                                            </View>
                                        )}
                                    </>
                                )}

                                <Text style={[styles.reviewDate, { color: theme.colors.onSurfaceVariant }]}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    {reviews.length > REVIEWS_PER_PAGE && (
                        <View style={styles.paginationRow}>
                            <Button
                                mode="outlined"
                                onPress={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                                disabled={reviewsPage === 1}
                            >
                                {t("equipment.reviews.previousPage")}
                            </Button>
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                {t("equipment.reviews.pageLabel", { current: reviewsPage, total: totalReviewPages })}
                            </Text>
                            <Button
                                mode="outlined"
                                onPress={() => setReviewsPage((prev) => Math.min(totalReviewPages, prev + 1))}
                                disabled={reviewsPage === totalReviewPages}
                            >
                                {t("equipment.reviews.nextPage")}
                            </Button>
                        </View>
                    )}
                </Modal>
            </Portal>
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
    reviewSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    reviewFormContainer: {
        marginBottom: 16,
    },
    reviewFormLabel: {
        marginBottom: 8,
        fontWeight: "600",
    },
    starRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    ratingButton: {
        marginRight: 6,
    },
    reviewInput: {
        marginTop: 12,
        marginBottom: 12,
    },
    reviewItem: {
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 12,
        marginTop: 12,
    },
    reviewHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    reviewAuthorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    reviewAuthor: {
        fontWeight: "600",
    },
    editedTag: {
        fontSize: 12,
        fontWeight: "600",
    },
    reviewActionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        gap: 6,
    },
    reviewDate: {
        marginTop: 6,
        fontSize: 12,
    },
    reviewsModalContainer: {
        margin: 16,
        borderRadius: 12,
        padding: 16,
        maxHeight: "85%",
    },
    reviewsModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    reviewsModalScroll: {
        maxHeight: 520,
    },
    paginationRow: {
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
    },
}); 