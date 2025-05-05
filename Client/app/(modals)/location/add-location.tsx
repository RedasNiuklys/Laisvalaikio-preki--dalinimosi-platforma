import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "../../../src/context/AuthContext";
import LocationFormScreen from "../../../src/pages/LocationFormScreen";
import * as LocationService from "expo-location";
import { Appbar } from "react-native-paper";
import { router } from "expo-router";

export default function AddLocationModal() {
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
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Location" />
      </Appbar.Header>
      <LocationFormScreen
        initialCoordinates={
          currentLocation?.coords
            ? {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }
            : undefined
        }
        isEditing={false}
      />
    </View>
  );
}
