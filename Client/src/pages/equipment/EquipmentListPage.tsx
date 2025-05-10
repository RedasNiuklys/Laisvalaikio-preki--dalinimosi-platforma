import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, Platform, Image, useWindowDimensions } from "react-native";
import {
    Text,
    Card,
    FAB,
    useTheme,
    Button,
    ActivityIndicator,
    IconButton,
    Chip,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import LocationMap, { LocationMapRef } from "@/src/components/LocationMap";
import * as equipmentApi from "@/src/api/equipmentApi";
import * as categoryApi from "@/src/api/categoryApi";
import { Location as LocationType } from "@/src/types/Location";
import { Equipment } from "@/src/types/Equipment";
import { Category } from "@/src/types/Category";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { OUTDOOR_ICONS } from "@/src/assets/CategoryIcons";

export default function EquipmentListPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [locations, setLocations] = useState<LocationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
    const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
    const [isMapExpanded, setIsMapExpanded] = useState(true);
    const theme = useTheme();
    const mapRef = useRef<LocationMapRef>(null);
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isNarrowScreen = width < 420;

    useEffect(() => {
        fetchEquipment();
        fetchCategories();
        getCurrentLocation();
    }, []);

    useEffect(() => {
        filterEquipment();
    }, [selectedCategory, equipment]);

    const fetchCategories = async () => {
        try {
            const data = await categoryApi.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("error", t("category.errors.fetchFailed"));
        }
    };

    const filterEquipment = () => {
        let filtered = equipment;

        if (selectedCategory) {
            const selectedCategoryObj = categories.find(
                (c) => c.name === selectedCategory
            );
            if (selectedCategoryObj) {
                if (selectedCategoryObj.parentCategoryId === null) {
                    // If parent category is selected, show all its children
                    const childCategories = categories
                        .filter((c) => c.parentCategoryId === selectedCategoryObj.id)
                        .map((c) => c.name);
                    filtered = filtered.filter(
                        (item) =>
                            childCategories.includes(item.category) ||
                            item.category === selectedCategory
                    );
                } else {
                    // If child category is selected, show only that category
                    filtered = filtered.filter(
                        (item) => item.category === selectedCategory
                    );
                }
            }
        }

        setFilteredEquipment(filtered);
    };

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                showToast("error", t("location.errors.permissionDenied"));
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const currentLoc: LocationType = {
                id: "current",
                name: t("location.currentLocation"),
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                streetAddress: "",
                city: "",
                country: "",
                userId: user?.id || "",
            };
            setCurrentLocation(currentLoc);
            setSelectedLocation(currentLoc);
            mapRef.current?.animateToLocation(currentLoc);
        } catch (error) {
            console.error("Error getting current location:", error);
            showToast("error", t("location.errors.locationFetchFailed"));
        }
    };

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const data = await equipmentApi.getAll();
            setEquipment(data);
            setLocations(data.map((item) => item.location));
        } catch (error) {
            console.error("Error fetching equipment:", error);
            showToast("error", t("equipment.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = (location: LocationType) => {
        setSelectedLocation(location);
        mapRef.current?.animateToLocation(location);
    };

    const handleLocationClick = (location: LocationType) => {
        if (location.latitude && location.longitude) {
            mapRef.current?.animateToLocation(location);
        }
    };

    const toggleMap = () => {
        setIsMapExpanded(!isMapExpanded);
    };

    const renderCategoryChips = () => {
        return (
            <View style={styles.filtersContainer}>
                <Chip
                    selected={selectedCategory === ""}
                    onPress={() => setSelectedCategory("")}
                    style={styles.categoryChip}
                    icon={() => (
                        <MaterialCommunityIcons
                            name="filter-variant"
                            size={16}
                            color={theme.colors.primary}
                        />
                    )}
                >
                    {t("common.all")}
                </Chip>
                {categories.map((category) => {
                    const iconInfo = OUTDOOR_ICONS.find(icon => icon.label.toLowerCase() === category.name.toLowerCase());
                    return (
                        <Chip
                            key={category.id}
                            selected={selectedCategory === category.name}
                            onPress={() => setSelectedCategory(category.name)}
                            style={[
                                styles.categoryChip,
                                category.parentCategoryId === null && {
                                    backgroundColor: theme.colors.primaryContainer,
                                },
                                selectedCategory === category.name && {
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
                            {isNarrowScreen ? "" : category.name}
                        </Chip>
                    );
                })}
            </View>
        );
    };

    // Calculate optimal card width and number of columns
    const calculateGridLayout = () => {
        const minCardWidth = 120;
        const maxCardWidth = 170;
        const containerPadding = 16; // 8px padding on each side
        const cardSpacing = 8; // 4px margin on each side of card
        const availableWidth = width - containerPadding;

        // Calculate how many cards can fit with minimum width
        const maxColumns = Math.floor(availableWidth / (minCardWidth + cardSpacing));

        // Calculate actual card width based on number of columns
        const cardWidth = Math.min(
            maxCardWidth,
            Math.max(
                minCardWidth,
                (availableWidth - (maxColumns - 1) * cardSpacing) / maxColumns
            )
        );

        return {
            numColumns: maxColumns,
            cardWidth,
        };
    };

    const { numColumns, cardWidth } = calculateGridLayout();

    const renderEquipmentItem = ({ item }: { item: Equipment }) => {
        return (
            <Card
                style={[styles.equipmentCard, { width: cardWidth }]}
                onPress={() => router.push(`/equipment/${item.id}`)}
            >
                <Card.Cover
                    source={{ uri: item.imageUrl }}
                    style={styles.cardImage}
                />
                <Card.Title
                    title={item.name}
                    subtitle={item.category}
                    titleStyle={styles.cardTitle}
                    subtitleStyle={styles.cardSubtitle}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon="chevron-right"
                            size={20}
                            onPress={() => router.push(`/equipment/${item.id}`)}
                        />
                    )}
                />
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
            <View style={[styles.mapContainer, isMapExpanded ? styles.mapExpanded : styles.mapCollapsed]}>
                <LocationMap
                    ref={mapRef}
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    onLocationClick={handleLocationClick}
                />
                <IconButton
                    icon={isMapExpanded ? "chevron-down" : "chevron-up"}
                    onPress={toggleMap}
                    style={[styles.mapToggle, { backgroundColor: theme.colors.surface }]}
                />
            </View>

            {renderCategoryChips()}

            <FlatList
                key={width.toString()}
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
                onPress={() => router.push("/equipment/new")}
            />
        </View>
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
    mapContainer: {
        position: "relative",
        overflow: "hidden",
    },
    mapExpanded: {
        height: 300,
    },
    mapCollapsed: {
        height: 100,
    },
    mapToggle: {
        position: "absolute",
        top: 8,
        right: 8,
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
        padding: 8,
    },
    row: {
        justifyContent: 'flex-start',
        gap: 8,
    },
    equipmentCard: {
        marginBottom: 8,
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
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 0,
    },
}); 