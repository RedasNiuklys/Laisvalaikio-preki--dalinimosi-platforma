import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LocationMapProps, LocationMapRef } from "./LocationMap";
import { Location } from "../types/Location";

const defaultCoordinates = {
  latitude: 54.903929466398154,
  longitude: 23.957888105144654,
};

const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  (
    {
      locations = [],
      selectedLocation = null,
      onLocationSelect,
      onLocationClick = () => {},
      isAddingLocation = false,
    },
    ref
  ) => {
    const mapRef = useRef<MapView>(null);

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
                pinColor="blue"
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
