import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LocationMapProps, LocationMapRef } from "./LocationMap";
import { Location } from "../types/Location";
import { useTheme } from "react-native-paper";

const defaultCoordinates = {
  latitude: 54.903929466398154,
  longitude: 23.957888105144654,
};

// Map styles for light and dark themes
const mapStyles = {
  light: [],
  dark: [
    {
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ],
};

const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  (
    {
      locations = [],
      selectedLocation = null,
      onLocationSelect,
      onLocationClick = () => { },
      isAddingLocation = false,
    },
    ref
  ) => {
    const mapRef = useRef<MapView>(null);
    const theme = useTheme();
    const isDark = theme.dark;

    useImperativeHandle(ref, () => ({
      animateToLocation: (location: Location) => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: location.latitude ?? 0,
              longitude: location.longitude ?? 0,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000
          );
        }
      },
    }));

    const handleMapPress = (event: any) => {
      if (isAddingLocation) {
        const { coordinate } = event.nativeEvent;
        onLocationSelect(coordinate);
      }
    };

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: selectedLocation?.latitude ?? defaultCoordinates.latitude,
            longitude:
              selectedLocation?.longitude ?? defaultCoordinates.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={handleMapPress}
          customMapStyle={isDark ? mapStyles.dark : mapStyles.light}
        >
          {locations.map((location, index) =>
            location.latitude && location.longitude ? (
              <Marker
                key={location.id || index}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
                description={location.description}
                onPress={() => onLocationClick(location)}
                pinColor={selectedLocation?.id === location.id ? "red" : "blue"}
              />
            ) : null
          )}
          {selectedLocation &&
            selectedLocation.latitude &&
            selectedLocation.longitude && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                pinColor="red"
              />
            )}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default LocationMap;
