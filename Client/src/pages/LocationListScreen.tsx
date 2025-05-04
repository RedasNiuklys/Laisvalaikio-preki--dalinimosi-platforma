import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, Platform, Linking } from "react-native";
import { Text, Card, FAB, useTheme, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getLocations } from "../api/locationApi";
import { showToast } from "../components/Toast";
import { Location } from "../types/Location";
import LocationMap, { LocationMapRef } from "../components/LocationMap";
import { useTranslation } from "react-i18next";

export default function LocationListScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const navigation = useNavigation();
  const theme = useTheme();
  const mapRef = useRef<LocationMapRef>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      const locationArray = Array.isArray(data) ? data : [];
      setLocations(locationArray);
    } catch (error) {
      console.error("Error fetching locations:", error);
      showToast("error", t("location.errors.addressFetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    navigation.navigate("Edit Location", {
      location,
      isEditing: true,
      onSubmitSuccess: fetchLocations,
    });
  };

  const handleLocationClick = (location: Location) => {
    if (location.latitude && location.longitude) {
      setSelectedLocation(location);
      mapRef.current?.animateToLocation(location);
    } else {
      showToast("error", t("location.errors.addressFetchFailed"));
    }
  };

  const handleShowOnMap = (location: Location) => {
    if (location.latitude && location.longitude) {
      setSelectedLocation(location);
      mapRef.current?.animateToLocation(location);
    } else {
      showToast("error", t("location.errors.addressFetchFailed"));
    }
  };

  const openInMaps = (location: Location) => {
    if (Platform.OS === "web" && location.latitude && location.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
      Linking.openURL(url);
    }
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{item.name}</Text>
        <Text variant="bodyMedium">{item.streetAddress}</Text>
        <View style={styles.cardActions}>
          <Button
            mode="contained-tonal"
            onPress={() => handleShowOnMap(item)}
            icon="map-marker"
          >
            {t("location.currentLocation")}
          </Button>
          {Platform.OS === "web" && item.latitude && item.longitude && (
            <Button
              mode="contained-tonal"
              onPress={() => openInMaps(item)}
              icon="google-maps"
            >
              {t("location.openInMaps")}
            </Button>
          )}
          <Button
            mode="contained"
            onPress={() => handleLocationSelect(item)}
            icon="pencil"
          >
            {t("common.buttons.edit")}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="titleLarge" style={styles.title}>
        {t("navigation.locations")}
      </Text>

      <View style={styles.mapContainer}>
        <LocationMap
          ref={mapRef}
          locations={locations}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          onLocationClick={handleLocationClick}
          isAddingLocation={false}
        />
        {Platform.OS === "web" &&
          selectedLocation?.latitude &&
          selectedLocation?.longitude && (
            <Button
              mode="contained-tonal"
              onPress={() => openInMaps(selectedLocation)}
              icon="google-maps"
              style={styles.openInMapsButton}
            >
              {t("location.openInMaps")}
            </Button>
          )}
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={(item: Location) => item.id?.toString() ?? ""}
          contentContainerStyle={styles.list}
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
        onPress={() =>
          navigation.navigate("Add Location", {
            initialCoordinates: {
              latitude: 54.903929466398154,
              longitude: 23.957888105144654,
            },
            isEditing: false,
            onSubmitSuccess: fetchLocations,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  mapContainer: {
    height: "45%", // Slightly less than 50% to account for the title
    marginBottom: 16,
    position: "relative",
  },
  listContainer: {
    flex: 1, // Takes remaining space
  },
  list: {
    paddingBottom: 80, // Space for FAB
  },
  card: {
    marginBottom: 8,
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
  openInMapsButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 1,
  },
});
