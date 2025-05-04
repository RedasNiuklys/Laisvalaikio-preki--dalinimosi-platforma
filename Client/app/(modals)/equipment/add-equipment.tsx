import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "../../../src/context/AuthContext";
import AddEquipmentScreen from "../../../src/pages/AddEquipmentScreen";
import * as LocationService from "expo-location";

export default function AddEquipmentModal() {
  const { user } = useAuth();
  const [locationPermission, setLocationPermission] =
    useState<LocationService.PermissionStatus | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<LocationService.LocationObject | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } =
        await LocationService.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === "granted") {
        const location = await LocationService.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  if (!user) {
    return null; // Or redirect to login
  }

  return (
    <View style={{ flex: 1 }}>
      <AddEquipmentScreen
        initialLocation={
          currentLocation?.coords
            ? {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }
            : undefined
        }
      />
    </View>
  );
}
