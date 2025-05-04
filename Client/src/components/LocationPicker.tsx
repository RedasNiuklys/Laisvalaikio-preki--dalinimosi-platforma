import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button } from "react-native-paper";
import Geocoding from "react-native-geocoding";
import LocationMap, { LocationMapRef } from "./LocationMap";
import { showToast } from "./Toast";
import { GOOGLE_API_KEY } from "../utils/envConfig";
import { useTranslation } from "react-i18next";
import { Location, LocationFormData } from "../types/Location";

// Initialize Geocoding with your API key
Geocoding.init(GOOGLE_API_KEY);

type Coordinates = {
  latitude: number;
  longitude: number;
};

interface LocationPickerProps {
  initialLocation?: LocationFormData;
  onLocationSelected?: (location: Location) => void;
}

const LocationPicker = ({
  initialLocation,
  onLocationSelected,
}: LocationPickerProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationFormData>({
    latitude: initialLocation?.latitude ?? 54.903929466398154,
    longitude: initialLocation?.longitude ?? 23.957888105144654,
    name: initialLocation?.name ?? "",
    streetAddress: initialLocation?.streetAddress ?? "",
    city: initialLocation?.city ?? "",
    country: initialLocation?.country ?? "",
    userId: initialLocation?.userId ?? "",
  });
  const mapRef = useRef<LocationMapRef>(null);

  const handleMapUpdate = (location: Location) => {
    if (mapRef.current) {
      mapRef.current.animateToLocation(location);
    }
  };

  const handleLocationSelect = async (location: LocationFormData) => {
    try {
      const response = await Geocoding.from(
        location.latitude + "," + location.longitude
      );
      const result = response.results[0];
      const addressComponents = result.address_components;

      let streetNumber = "";
      let route = "";
      let city = "";
      let country = "";
      let state = "";
      let zipCode = "";

      for (let component of addressComponents) {
        if (component.types.includes("street_number")) {
          streetNumber = component.long_name;
        }
        if (component.types.includes("route")) {
          route = component.long_name;
        }
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("country")) {
          country = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        if (component.types.includes("postal_code")) {
          zipCode = component.long_name;
        }
      }

      const newLocation: Location = {
        description: "",
        latitude: location.latitude ?? 0,
        longitude: location.longitude ?? 0,
        name: result.formatted_address,
        streetAddress: `${streetNumber} ${route}`.trim(),
        city,
        country,
        state: "",
        postalCode: "",
        userId: "",
      };

      setSelectedLocation(newLocation);
      handleMapUpdate(newLocation);
      if (onLocationSelected) {
        onLocationSelected(newLocation);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      showToast("error", t("location.errors.addressFetchFailed"));
    }
  };

  const handleSearch = async () => {
    try {
      const response = await Geocoding.from(searchQuery);
      const { lat, lng } = response.results[0].geometry.location;
      await handleLocationSelect({
        latitude: lat,
        longitude: lng,
        name: response.results[0].formatted_address,
        streetAddress: "",
        city: "",
        userId: "",
        country: "",
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      showToast("error", t("location.errors.addressFetchFailed"));
    }
  };

  const handleMapLocationSelect = (location: LocationFormData) => {
    handleLocationSelect(location);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          label={t("location.search")}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" onPress={handleSearch} />}
        />
      </View>
      <LocationMap
        ref={mapRef}
        selectedLocation={selectedLocation}
        onLocationSelect={handleMapLocationSelect}
        isAddingLocation={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 10,
  },
  searchInput: {
    marginBottom: 10,
  },
});

export default LocationPicker;
