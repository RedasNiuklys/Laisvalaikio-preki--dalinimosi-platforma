import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, FAB, useTheme, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getLocations } from "../api/locationApi";
import { showToast } from "../components/Toast";
import { Location } from "../types/Location";
import LocationMap, { LocationMapRef } from "../components/LocationMap";

export default function LocationListScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const navigation = useNavigation();
  const theme = useTheme();
  const mapRef = useRef<LocationMapRef>(null);

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
      showToast("error", "Failed to load locations");
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
      showToast("error", "Location coordinates not available");
    }
  };

  const handleShowOnMap = (location: Location) => {
    if (location.latitude && location.longitude) {
      setSelectedLocation(location);
      mapRef.current?.animateToLocation(location);
    } else {
      showToast("error", "Location coordinates not available");
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
            Show on Map
          </Button>
          <Button
            mode="contained"
            onPress={() => handleLocationSelect(item)}
            icon="pencil"
          >
            Edit
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineMedium" style={styles.title}>
        Locations
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
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={(item: Location) => item.id?.toString() ?? ""}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No locations found</Text>
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
});
