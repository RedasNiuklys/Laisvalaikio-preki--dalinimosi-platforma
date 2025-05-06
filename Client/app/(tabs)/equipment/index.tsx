import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, Platform, Image } from "react-native";
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
import { useNavigation } from "@react-navigation/native";
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
import { RootStackParamList } from "@/src/types/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type EquipmentScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(
    null
  );
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(
    null
  );
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const navigation = useNavigation<EquipmentScreenNavigationProp>();
  const theme = useTheme();
  const mapRef = useRef<LocationMapRef>(null);
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
    getCurrentLocation();
    setLocations(locations);
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
      // TODO: Implement getEquipment API call
      const data = await equipmentApi.getAll();
      setEquipment(data);

      // Extract unique locations from equipment
      const uniqueLocations = Array.from(
        new Set(data.map((item) => item.locationId))
      ).map((locationId) => {
        const item = data.find((e) => e.locationId === locationId);
        return {
          id: locationId,
          name: item?.location.name || "",
          latitude: item?.location.latitude || 0,
          longitude: item?.location.longitude || 0,
          streetAddress: item?.location.streetAddress || "",
          city: item?.location.city || "",
          country: item?.location.country || "",
          userId: item?.location.userId || "",
        };
      });

      setLocations(uniqueLocations);
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
        {categories.map((category) => (
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
            {category.name}
          </Chip>
        ))}
      </View>
    );
  };

  const renderEquipmentItem = ({ item }: { item: Equipment }) => {
    const mainImage = item.images?.find((img) => img.isMainImage)?.imageUrl;

    return (
      <Card
        style={styles.card}
        onPress={() => router.push(`/equipment/${item.id}`)}
      >
        {mainImage && (
          <Card.Cover source={{ uri: mainImage }} style={styles.cardImage} />
        )}
        <Card.Content>
          <Text variant="titleMedium">{item.name}</Text>
          <Text variant="bodyMedium">{item.description}</Text>
          <Text variant="bodySmall">{item.location.name}</Text>
          <Text variant="bodySmall">
            {`${item.location.streetAddress}, ${item.location.city}`}
          </Text>
          <View style={styles.cardActions}>
            <Button
              mode="contained-tonal"
              onPress={() => handleLocationClick(item.location)}
              icon="map-marker"
            >
              {t("location.showOnMap")}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="titleLarge" style={styles.title}>
        {t("navigation.equipment")}
      </Text>

      <View
        style={[
          styles.mapContainer,
          !isMapExpanded && styles.mapContainerCollapsed,
        ]}
      >
        <LocationMap
          ref={mapRef}
          locations={locations}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          onLocationClick={handleLocationClick}
          isAddingLocation={false}
        />
        <IconButton
          icon={isMapExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          onPress={toggleMap}
          style={styles.mapToggle}
          accessibilityLabel={
            isMapExpanded ? t("common.collapse") : t("common.expand")
          }
        />
      </View>

      {renderCategoryChips()}

      <View style={styles.listContainer}>
        <FlatList
          data={filteredEquipment}
          renderItem={renderEquipmentItem}
          keyExtractor={(item) => item.id?.toString() ?? ""}
          contentContainerStyle={styles.list}
          numColumns={Platform.OS === "web" ? 3 : 2}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t("equipment.list.noResults")}
            </Text>
          }
        />
      </View>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push("/equipment/add-equipment")}
        accessibilityLabel={t("equipment.actions.addNew")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 16,
  },
  mapContainer: {
    height: "45%",
    marginBottom: 16,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  mapContainerCollapsed: {
    height: 100,
  },
  mapToggle: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 20,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingBottom: 80,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: Platform.OS === "web" ? "30%" : "45%",
    maxWidth: Platform.OS === "web" ? "30%" : "45%",
    marginBottom: 16,
  },
  cardImage: {
    height: 450,
    width: "100%",
    resizeMode: "cover",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 4,
    marginBottom: 4,
  },
});
