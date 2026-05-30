import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Platform } from "react-native";
import { Text, Card, Chip, ActivityIndicator, useTheme, Divider } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as bookingApi from "@/src/api/bookingApi";
import { Booking, BookingStatus } from "@/src/types/Booking";
import BookingsCalendar from "@/src/components/BookingsCalendar";
import { showToast } from "@/src/components/Toast";

const STATUS_COLOR: Record<BookingStatus, string> = {
    [BookingStatus.Pending]: "#F59E0B",
    [BookingStatus.Planning]: "#8B5CF6",
    [BookingStatus.Approved]: "#2563EB",
    [BookingStatus.Picked]: "#2563EB",
    [BookingStatus.ReturnRequested]: "#F59E0B",
    [BookingStatus.ReturnEarlyRequested]: "#F59E0B",
    [BookingStatus.Returned]: "#059669",
    [BookingStatus.ReturnedEarly]: "#059669",
    [BookingStatus.Rejected]: "#DC2626",
    [BookingStatus.Cancelled]: "#6B7280",
};

function formatDateRange(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) =>
        d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${fmt(s)} – ${fmt(e)}`;
}

const ACTIVE_STATUSES: BookingStatus[] = [
    BookingStatus.Planning,
    BookingStatus.Pending,
    BookingStatus.Approved,
    BookingStatus.Picked,
    BookingStatus.ReturnRequested,
    BookingStatus.ReturnEarlyRequested,
];

export default function BookingsScreen() {
    const { t } = useTranslation();
    const theme = useTheme();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await bookingApi.getUserBookings();
            // Sort upcoming first, then by start date
            data.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
            setBookings(data);
        } catch {
            showToast("error", t("booking.error", { defaultValue: "Failed to load bookings" }));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [fetchBookings])
    );

    const upcomingBookings = bookings.filter(
        (b) => ACTIVE_STATUSES.includes(b.status) && new Date(b.endDateTime) >= new Date()
    );

    const pastBookings = bookings.filter(
        (b) => !ACTIVE_STATUSES.includes(b.status) || new Date(b.endDateTime) < new Date()
    );

    const navigateToEquipment = (booking: Booking) => {
        router.push({
            pathname:
                Platform.OS === "web"
                    ? "/(modals)/equipment/[id]"
                    : "/equipment/details/[id]",
            params: { id: booking.equipmentId, open: "bookings" },
        } as any);
    };

    const renderBookingCard = (booking: Booking) => {
        const equipmentName = booking.equipment?.name ?? booking.equipmentId;
        const statusKey = booking.status.toLowerCase();
        const statusLabel = t(`booking.status.${statusKey}`, { defaultValue: booking.status });
        const color = STATUS_COLOR[booking.status] ?? "#6B7280";

        return (
            <Card
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigateToEquipment(booking)}
            >
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text variant="titleSmall" numberOfLines={1} style={styles.equipmentName}>
                            {equipmentName}
                        </Text>
                        <Chip
                            compact
                            style={{ backgroundColor: color + "22" }}
                            textStyle={{ color, fontSize: 11 }}
                        >
                            {statusLabel}
                        </Chip>
                    </View>
                    <View style={styles.dateRow}>
                        <MaterialCommunityIcons name="calendar-range" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                            {formatDateRange(booking.startDateTime, booking.endDateTime)}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
                {t("profile.myBookings", { defaultValue: "My Bookings" })}
            </Text>

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Calendar overview */}
                <View style={styles.section}>
                    <BookingsCalendar bookings={bookings} />
                </View>

                {/* Upcoming / active bookings */}
                {upcomingBookings.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                            {t("booking.filters.showCategories", { defaultValue: "Upcoming" })}
                        </Text>
                        {upcomingBookings.map(renderBookingCard)}
                    </View>
                )}

                {/* Past bookings */}
                {pastBookings.length > 0 && (
                    <View style={styles.section}>
                        <Divider style={styles.divider} />
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                            {t("equipment.calendar.past", { defaultValue: "Past" })}
                        </Text>
                        {pastBookings.map(renderBookingCard)}
                    </View>
                )}

                {bookings.length === 0 && (
                    <View style={styles.centered}>
                        <MaterialCommunityIcons name="calendar-blank" size={48} color={theme.colors.onSurfaceVariant} />
                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                            {t("booking.noBookings")}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { marginTop: 8, marginHorizontal: 16, marginBottom: 8 },
    scroll: { paddingBottom: 32 },
    section: { paddingHorizontal: 16, marginTop: 12 },
    sectionTitle: { marginBottom: 8 },
    divider: { marginBottom: 12 },
    bookingCard: { marginBottom: 8 },
    cardContent: { paddingVertical: 8 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    equipmentName: { flex: 1, marginRight: 8 },
    dateRow: { flexDirection: "row", alignItems: "center" },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
});
