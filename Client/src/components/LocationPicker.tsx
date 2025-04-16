import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button } from "react-native-paper";
import Geocoding from "react-native-geocoding";
import LocationMap from "./LocationMap";
import { showToast } from "./Toast";
import { GOOGLE_API_KEY } from "../utils/envConfig";

// Initialize Geocoding with your API key
Geocoding.init(GOOGLE_API_KEY);
console.log("GOOGLE_API_KEY", GOOGLE_API_KEY);

type LocationPickerProps = {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationSelected: (locationData: {
    latitude: number;
    longitude: number;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => void;
};

const LocationPicker = ({
  initialLocation,
  onLocationSelected,
}: LocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || {
      latitude: 54.903929466398154,
      longitude: 23.957888105144654,
    }
  );
  const mapRef = useRef(null);

  const handleMapUpdate = (coordinates: {
    latitude: number;
    longitude: number;
  }) => {
    if (mapRef.current) {
      // @ts-ignore - we know mapRef.current exists and has these methods
      mapRef.current.animateToRegion(
        {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01, // Smaller value = more zoom
          longitudeDelta: 0.01,
        },
        1000
      ); // Animation duration in ms
    }
  };

  const handleSearch = async () => {
    try {
      const response = await Geocoding.from(searchQuery);
      const { lat, lng } = response.results[0].geometry.location;
      const coordinates = { latitude: lat, longitude: lng };
      setSelectedLocation(coordinates);
      handleMapUpdate(coordinates);
      handleLocationSelect(coordinates);
    } catch (error) {
      console.error("Geocoding error:", error);
      showToast("error", "Failed to find location");
    }
  };

  const handleLocationSelect = async (coordinates: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const response = await Geocoding.from(
        coordinates.latitude,
        coordinates.longitude
      );
      const result = response.results[0];

      // Parse address components
      const addressComponents = result.address_components;
      let streetNumber = "",
        route = "",
        city = "",
        state = "",
        postalCode = "",
        country = "";

      addressComponents.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        } else if (types.includes("route")) {
          route = component.long_name;
        } else if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name;
        } else if (types.includes("country")) {
          country = component.long_name;
        }
      });

      const streetAddress = `${streetNumber} ${route}`.trim();

      setSelectedLocation(coordinates);
      handleMapUpdate(coordinates);

      onLocationSelected({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        streetAddress,
        city,
        state,
        postalCode,
        country,
      });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      showToast("error", "Failed to get address details");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          mode="outlined"
          placeholder="Search location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" onPress={handleSearch} />}
          onSubmitEditing={handleSearch}
        />
      </View>

      <LocationMap
        ref={mapRef}
        locations={[]}
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
        onAddLocation={handleLocationSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    marginBottom: 8,
  },
});

export default LocationPicker;
