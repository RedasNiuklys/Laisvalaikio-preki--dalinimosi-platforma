import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Location } from "../types/Location";

type LocationMapProps = {
  locations: Location[];
  selectedLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationSelect: (location: Location) => void;
  onAddLocation: (coordinates: { latitude: number; longitude: number }) => void;
};

export type LocationMapRef = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration: number
  ) => void;
};

const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  ({ locations, selectedLocation, onLocationSelect, onAddLocation }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration) => {
        mapRef.current?.animateToRegion(region, duration);
      },
    }));

    const handleMapPress = (event: any) => {
      const { coordinate } = event.nativeEvent;
      onAddLocation(coordinate);
    };

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: selectedLocation?.latitude || 54.903929466398154,
            longitude: selectedLocation?.longitude || 23.957888105144654,
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
                onPress={() => onLocationSelect(location)}
              />
            ) : null
          )}
          {selectedLocation && (
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
