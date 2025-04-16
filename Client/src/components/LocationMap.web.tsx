import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import WebMap from "./WebMap";
import { Location } from "../types/Location";

export default function LocationMap({
  locations,
  onLocationSelect,
  onAddLocation,
}: {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  onAddLocation: (location: Location) => void;
}) {
  const webLocations: Location[] = locations.map((location: Location) => ({
    lat: location.latitude,
    lng: location.longitude,
    id: location.id,
    name: location.name,
    streetAddress: location.streetAddress,
    city: location.city,
    country: location.country,
  }));
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
  };
  const initialPosition = {
    latitude: 54.903929466398154,
    longitude: 23.957888105144654,
  };
  const handleAddLocation = (coordinates: Location) => {
    onAddLocation(coordinates);
    setIsAddingLocation(false);
  };

  return (
    <View style={styles.container}>
      <WebMap
        initialPosition={{
          lat: initialPosition.latitude,
          lng: initialPosition.longitude,
        }}
        onLocationSelect={handleAddLocation}
        locations={webLocations}
        onLocationClick={handleLocationSelect}
        isAddingLocation={isAddingLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
  },
});
