import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, useWindowDimensions, Pressable, Platform } from "react-native";
import {
    Text,
    Card,
    FAB,
    useTheme,
    Button,
    ActivityIndicator,
    Chip,
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
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [showCategories, setShowCategories] = useState(true);
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

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchEquipment();
    }, [isAuthenticated, user?.id, ownerOnly]);

    useEffect(() => {
        filterEquipment();
    }, [selectedCategory, equipment, categories]);

    const fetchCategories = async () => {
        try {
            const data = await categoryApi.getCategories();
            console.log("data", data);
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("error", t("category.errors.fetchFailed"));
        }
    };

    const filterEquipment = () => {
        let filtered = equipment;
        console.log("selectedCategory", selectedCategory);
        if (selectedCategory !== "") {
            const selectedCategoryObj = categories.find(
                (c) => c.name === selectedCategory
            );
            if (selectedCategoryObj) {
                if (!selectedCategoryObj.parentCategoryId) {
                    // If parent category is selected, show all its children
                    const childCategories = categories
                        .filter((c) => c.parentCategoryId === selectedCategoryObj.id)
                        .map((c) => c.name);
                    filtered = filtered.filter(
                        (item) =>
                            childCategories.includes(item.category.name) ||
                            item.category.name === selectedCategory
                    );
                } else {
                    // If child category is selected, show only that category
                    filtered = filtered.filter(
                        (item) => item.category.name === selectedCategory
                    );
                }
            }
        }
        console.log("filtered", filtered.length);

        setFilteredEquipment(filtered);
    };

    const fetchEquipment = async () => {
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
                const allEquipment = await equipmentApi.getAll();
                data = user?.id
                    ? allEquipment.filter((item) => item.ownerId !== user.id)
                    : allEquipment;
            }

            setEquipment(data);
            console.log("equipment", data);
        } catch (error) {
            console.error("Error fetching equipment:", error);
            showToast("error", t("equipment.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
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
                    {showChipLabels ? t("common.all") : ""}
                </Chip>
                {categories.map((category) => {
                    return (
                        <Chip
                            key={category.id}
                            selected={selectedCategory === category.name}
                            onPress={() => setSelectedCategory(category.name)}
                            style={[
                                styles.categoryChip,
                                !category.parentCategoryId && {
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
                            {showChipLabels ? category.name : ""}
                        </Chip>
                    );
                })}
            </View>
        );
    };

    const renderEquipmentItem = ({ item }: { item: Equipment }) => {
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
                        subtitle={item.category.name}
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
                            category: selectedCategory
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