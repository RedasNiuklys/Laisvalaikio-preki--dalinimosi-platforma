import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, FlatList, useWindowDimensions, Pressable, Platform, TextInput } from "react-native";
import {
    Card,
    FAB,
    useTheme,
    Button,
    ActivityIndicator,
    Chip,
    Text,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import * as equipmentApi from "@/src/api/equipmentApi";
import * as categoryApi from "@/src/api/categoryApi";
import { Equipment } from "@/src/types/Equipment";
import { Category } from "@/src/types/Category";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getCategoryLabel } from "@/src/utils/categoryUtils";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";

const RADIUS_OPTIONS = [5, 10, 25, 50];

type EquipmentListPageProps = {
    ownerOnly?: boolean;
    pageTitle?: string;
};

export default function EquipmentListPage({
    ownerOnly = false,
    pageTitle,
}: EquipmentListPageProps) {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
    const [showCategories, setShowCategories] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [availableOnly, setAvailableOnly] = useState(false);
    const [nearMeEnabled, setNearMeEnabled] = useState(false);
    const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedRadius, setSelectedRadius] = useState(10);
    const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
    const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const startDateInputRef = useRef<any>(null);
    const endDateInputRef = useRef<any>(null);
    const theme = useTheme();
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isNarrowScreen = width < 420;
    const isMidWidth = width >= 420 && width <= 1025;
    const showChipLabels = !isMidWidth;
    const showCardActionLabels = !isMidWidth;
    const numColumns = isNarrowScreen ? 1 : 3;
    const listHorizontalPadding = 16;
    const cardGap = 12;
    const cardWidth =
        (width - listHorizontalPadding * 2 - cardGap * (numColumns - 1)) /
        numColumns;

    const fetchCategories = useCallback(async () => {
        try {
            const data = await categoryApi.getCategories();
            console.log("data", data);
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("error", t("category.errors.fetchFailed"));
        }
    }, [t]);

    const filterEquipment = useCallback(() => {
        let filtered = equipment;

        if (selectedCategorySlug !== "") {
            const selectedCategoryObj = categories.find(
                (c) => c.slug === selectedCategorySlug
            );
            if (selectedCategoryObj) {
                if (!selectedCategoryObj.parentCategoryId) {
                    const childCategories = categories
                        .filter((c) => c.parentCategoryId === selectedCategoryObj.id)
                        .map((c) => c.slug);
                    filtered = filtered.filter(
                        (item) =>
                            childCategories.includes(item.category.slug) ||
                            item.category.slug === selectedCategorySlug
                    );
                } else {
                    filtered = filtered.filter(
                        (item) => item.category.slug === selectedCategorySlug
                    );
                }
            }
        }

        if (searchText.trim()) {
            const term = searchText.trim().toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.name.toLowerCase().includes(term) ||
                    (item.description?.toLowerCase().includes(term) ?? false)
            );
        }

        if (availableOnly) {
            filtered = filtered.filter((item) => item.IsAvailable);
        }

        setFilteredEquipment(filtered);
    }, [categories, equipment, selectedCategorySlug, searchText, availableOnly]);

    const toggleNearMe = useCallback(async () => {
        if (nearMeEnabled) {
            setNearMeEnabled(false);
            setUserCoords(null);
            return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            showToast("error", t("search.locationPermissionDenied"));
            return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setNearMeEnabled(true);
    }, [nearMeEnabled, t]);

    const fetchEquipment = useCallback(async (startDate?: Date | null, endDate?: Date | null) => {
        if (!isAuthenticated) {
            setEquipment([]);
            setFilteredEquipment([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let data: Equipment[] = [];

            if (ownerOnly) {
                data = user?.id ? await equipmentApi.getByOwner(user.id) : [];
            } else {
                const filters: equipmentApi.EquipmentFilterParams = {};
                if (startDate && endDate) {
                    filters.startDate = startDate.toISOString().split("T")[0];
                    filters.endDate = endDate.toISOString().split("T")[0];
                }
                if (nearMeEnabled && userCoords) {
                    filters.latitude = userCoords.latitude;
                    filters.longitude = userCoords.longitude;
                    filters.radiusKm = selectedRadius;
                }
                const allEquipment = await equipmentApi.getAll(filters);
                data = user?.id
                    ? allEquipment.filter((item) => item.ownerId !== user.id)
                    : allEquipment;
            }

            setEquipment(data);
        } catch (error) {
            console.error("Error fetching equipment:", error);
            showToast("error", t("equipment.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, nearMeEnabled, userCoords, selectedRadius, ownerOnly, t, user?.id]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchEquipment();
    }, [fetchEquipment]);

    useEffect(() => {
        if (filterStartDate && filterEndDate) {
            fetchEquipment(filterStartDate, filterEndDate);
        } else if (!filterStartDate && !filterEndDate) {
            fetchEquipment();
        }
    }, [filterStartDate, filterEndDate]);

    useEffect(() => {
        fetchEquipment(filterStartDate, filterEndDate);
    }, [nearMeEnabled, userCoords, selectedRadius, fetchEquipment, filterStartDate, filterEndDate]);

    useEffect(() => {
        filterEquipment();
    }, [filterEquipment]);

    const clearDateFilter = () => {
        setFilterStartDate(null);
        setFilterEndDate(null);
    };

    const formatDate = (date: Date) =>
        date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });

    const renderCategoryChips = () => {
        return (
            <View style={styles.filtersContainer}>
                <Chip
                    selected={selectedCategorySlug === ""}
                    onPress={() => setSelectedCategorySlug("")}
                    style={styles.categoryChip}
                    icon={() => (
                        <MaterialCommunityIcons
                            name="filter-variant"
                            size={16}
                            color={theme.colors.primary}
                        />
                    )}
                >
                    {showChipLabels ? t("common.all") : ""}
                </Chip>
                {categories.map((category) => {
                    return (
                        <Chip
                            key={category.id}
                            selected={selectedCategorySlug === category.slug}
                            onPress={() => setSelectedCategorySlug(category.slug)}
                            style={[
                                styles.categoryChip,
                                !category.parentCategoryId && {
                                    backgroundColor: theme.colors.primaryContainer,
                                },
                                selectedCategorySlug === category.slug && {
                                    backgroundColor: theme.colors.primaryContainer,
                                    opacity: 0.8,
                                },
                            ]}
                            icon={() => (
                                <MaterialCommunityIcons
                                    name={category.iconName as any}
                                    size={16}
                                    color={theme.colors.primary}
                                />
                            )}
                        >
                            {showChipLabels ? getCategoryLabel(category, t) : ""}
                        </Chip>
                    );
                })}
            </View>
        );
    };

    const renderEquipmentItem = ({ item }: { item: Equipment }) => {
        console.log("Rendering item", item.id);
        const isOwner = item.ownerId === user?.id;
        const mainImage =
            item.images?.find((img) => img.isMainImage || img.isMain)?.imageUrl ||
            item.images?.find((img) => img.isMainImage || img.isMain)?.url ||
            item.images?.[0]?.imageUrl ||
            item.images?.[0]?.url;

        return (
            <Card style={[styles.equipmentCard, { width: cardWidth }]}>
                <Pressable
                    onPress={() => router.push({ pathname: "/equipment/[id]", params: { id: item.id } })}
                    style={{ flex: 1 }}
                >
                    <Card.Cover
                        source={{ uri: mainImage }}
                        style={styles.cardImage}
                    />
                    <Card.Title
                        title={item.name}
                        subtitle={
                            item.distanceKm != null
                                ? `${getCategoryLabel(item.category, t)} · ${item.distanceKm} ${t("search.km")}`
                                : getCategoryLabel(item.category, t)
                        }
                        titleStyle={styles.cardTitle}
                        subtitleStyle={styles.cardSubtitle}
                    />
                </Pressable>
                {isOwner ? (
                    <Card.Actions style={styles.cardActions}>
                        <Button
                            mode="outlined"
                            compact
                            icon="pencil"
                            style={[
                                styles.actionButton,
                                !showCardActionLabels && styles.iconOnlyActionButton,
                            ]}
                            contentStyle={!showCardActionLabels ? styles.iconOnlyButtonContent : undefined}
                            labelStyle={!showCardActionLabels ? styles.iconOnlyButtonLabel : undefined}
                            accessibilityLabel={t("equipment.actions.edit")}
                            onPress={() => router.push({ pathname: "/(modals)/equipment/edit/[id]", params: { id: item.id } })}
                        >
                            {showCardActionLabels ? t("equipment.actions.edit") : undefined}
                        </Button>
                        <Button
                            mode="contained-tonal"
                            compact
                            icon="calendar-month"
                            style={[
                                styles.actionButton,
                                !showCardActionLabels && styles.iconOnlyActionButton,
                            ]}
                            contentStyle={!showCardActionLabels ? styles.iconOnlyButtonContent : undefined}
                            labelStyle={!showCardActionLabels ? styles.iconOnlyButtonLabel : undefined}
                            accessibilityLabel={t("booking.title")}
                            onPress={() =>
                                router.push({
                                    pathname:
                                        Platform.OS === "web"
                                            ? "/(modals)/equipment/[id]"
                                            : "/equipment/details/[id]",
                                    params: { id: item.id, open: "bookings" },
                                } as any)
                            }
                        >
                            {showCardActionLabels ? t("booking.title") : undefined}
                        </Button>
                    </Card.Actions>
                ) : null}
            </Card>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

            <View style={styles.mapButtonContainer}>
                <Button
                    mode="contained"
                    icon="map"
                    onPress={() => router.push({
                        pathname: Platform.OS === "web" ? "/(modals)/map-modal" : "/map",
                        params: {
                            category: selectedCategorySlug
                        }
                    } as any)}
                    style={styles.mapButton}
                >
                    {t("location.showMap")}
                </Button>

                <Button
                    mode="outlined"
                    icon="filter-variant"
                    onPress={() => setShowCategories((prev) => !prev)}
                    style={styles.categoriesToggleButton}
                >
                    {showCategories
                        ? t("equipment.filters.hideCategories", { defaultValue: "Hide Categories" })
                        : t("equipment.filters.showCategories", { defaultValue: "Show Categories" })}
                </Button>
            </View>

            {/* Search bar */}
            <View style={[styles.searchRow, { borderColor: theme.colors.outline }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceVariant} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.onSurface }]}
                    placeholder={t("search.equipment")}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                />
                {searchText.length > 0 && (
                    <Pressable onPress={() => setSearchText("")}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                )}
            </View>

            {/* Quick filter chips */}
            <View style={styles.quickFiltersRow}>
                <Chip
                    selected={availableOnly}
                    onPress={() => setAvailableOnly((v) => !v)}
                    icon={() => (
                        <MaterialCommunityIcons
                            name="check-circle-outline"
                            size={16}
                            color={availableOnly ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                    )}
                    style={availableOnly ? { backgroundColor: theme.colors.primaryContainer } : undefined}
                >
                    {t("equipment.available")}
                </Chip>

                {!ownerOnly && (
                    <Chip
                        selected={nearMeEnabled}
                        onPress={toggleNearMe}
                        icon={() => (
                            <MaterialCommunityIcons
                                name="crosshairs-gps"
                                size={16}
                                color={nearMeEnabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
                            />
                        )}
                        style={nearMeEnabled ? { backgroundColor: theme.colors.primaryContainer } : undefined}
                    >
                        {t("search.nearMe")}
                    </Chip>
                )}

                {nearMeEnabled && RADIUS_OPTIONS.map((r) => (
                    <Chip
                        key={r}
                        selected={selectedRadius === r}
                        onPress={() => setSelectedRadius(r)}
                        style={selectedRadius === r ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
                    >
                        {r} {t("search.km")}
                    </Chip>
                ))}

                {/* Date range filter */}
                {Platform.OS === "web" ? (
                    <>
                        <View style={[styles.webDateInput, { borderColor: theme.colors.outline }]}>
                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 4 }}>
                                {t("booking.startDateTime")}:
                            </Text>
                            <input
                                type="date"
                                value={filterStartDate ? filterStartDate.toISOString().split("T")[0] : ""}
                                onChange={(e) => setFilterStartDate(e.target.value ? new Date(e.target.value) : null)}
                                style={{ border: "none", background: "transparent", fontSize: 13, color: "inherit", outline: "none" }}
                            />
                        </View>
                        <View style={[styles.webDateInput, { borderColor: theme.colors.outline }]}>
                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 4 }}>
                                {t("booking.endDateTime")}:
                            </Text>
                            <input
                                type="date"
                                value={filterEndDate ? filterEndDate.toISOString().split("T")[0] : ""}
                                min={filterStartDate ? filterStartDate.toISOString().split("T")[0] : undefined}
                                onChange={(e) => setFilterEndDate(e.target.value ? new Date(e.target.value) : null)}
                                style={{ border: "none", background: "transparent", fontSize: 13, color: "inherit", outline: "none" }}
                            />
                        </View>
                    </>
                ) : (
                    <>
                        <Chip
                            icon={() => <MaterialCommunityIcons name="calendar-start" size={16} color={theme.colors.onSurfaceVariant} />}
                            onPress={() => setShowStartPicker(true)}
                            selected={!!filterStartDate}
                            style={filterStartDate ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
                        >
                            {filterStartDate ? formatDate(filterStartDate) : t("booking.startDateTime")}
                        </Chip>
                        <Chip
                            icon={() => <MaterialCommunityIcons name="calendar-end" size={16} color={theme.colors.onSurfaceVariant} />}
                            onPress={() => setShowEndPicker(true)}
                            selected={!!filterEndDate}
                            style={filterEndDate ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
                        >
                            {filterEndDate ? formatDate(filterEndDate) : t("booking.endDateTime")}
                        </Chip>
                    </>
                )}

                {(filterStartDate || filterEndDate) && (
                    <Chip
                        icon={() => <MaterialCommunityIcons name="close" size={16} color={theme.colors.error} />}
                        onPress={clearDateFilter}
                        textStyle={{ color: theme.colors.error }}
                    >
                        {t("common.buttons.clear")}
                    </Chip>
                )}
            </View>

            {showStartPicker && Platform.OS !== "web" && (
                <DateTimePicker
                    value={filterStartDate ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_, date) => {
                        setShowStartPicker(false);
                        if (date) setFilterStartDate(date);
                    }}
                />
            )}
            {showEndPicker && Platform.OS !== "web" && (
                <DateTimePicker
                    value={filterEndDate ?? filterStartDate ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={filterStartDate ?? new Date()}
                    onChange={(_, date) => {
                        setShowEndPicker(false);
                        if (date) setFilterEndDate(date);
                    }}
                />
            )}

            {showCategories ? renderCategoryChips() : null}

            <FlatList
                key={`${numColumns}-${width}-${filteredEquipment.length}`}
                data={filteredEquipment}
                renderItem={renderEquipmentItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContainer, { backgroundColor: theme.colors.background }]}
                numColumns={numColumns}
                columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            />

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push("/equipment/add-equipment")}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pageTitle: {
        marginTop: 12,
        marginHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    mapButtonContainer: {
        padding: 16,
    },
    mapButton: {
        width: '100%',
    },
    categoriesToggleButton: {
        marginTop: 10,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 0,
    },
    quickFiltersRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        paddingBottom: 6,
        gap: 8,
        alignItems: "center",
    },
    webDateInput: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    filtersContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 8,
        gap: 8,
    },
    categoryChip: {
        marginRight: 8,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 96,
        paddingTop: 8,
    },
    row: {
        justifyContent: 'flex-start',
        gap: 12,
    },
    equipmentCard: {
        marginBottom: 12,
    },
    cardImage: {
        height: 120,
    },
    cardTitle: {
        fontSize: 14,
    },
    cardSubtitle: {
        fontSize: 12,
    },
    cardActions: {
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    iconOnlyActionButton: {
        flex: 0,
        width: 44,
        minWidth: 44,
        marginHorizontal: 4,
        paddingHorizontal: 0,
    },
    iconOnlyButtonContent: {
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 0,
        paddingHorizontal: 0,
    },
    iconOnlyButtonLabel: {
        width: 0,
        margin: 0,
    },
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 0,
    },
}); 