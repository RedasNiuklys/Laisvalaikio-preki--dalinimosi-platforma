import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Location } from "../types/Location";
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from "react-native-maps";
import { Text } from "react-native-paper";

export default function MobileMap({
  onLocationSelect,
  initialPosition = {
    latitude: 54.903929466398154,
    longitude: 23.957888105144654,
  },
  locations = [],
  onLocationClick,
  isAddingLocation = false,
  selectedLocation = null,
}: {
  onLocationSelect: (coordinates: any) => void;
  initialPosition: {
    latitude: number;
    longitude: number;
  };
  locations: Location[];
  onLocationClick: (location: Location) => void;
  isAddingLocation: boolean;
  selectedLocation: Location | null;
}) {
  const [marker, setMarker] = useState(initialPosition);
  const mapRef = React.useRef<MapView>(null);

  const handlePress = (event: any) => {
    if (isAddingLocation) {
      const { coordinate } = event.nativeEvent;
      setMarker(coordinate);
      onLocationSelect(coordinate);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      mapRef.current?.animateToRegion({
        latitude: selectedLocation.latitude || 0,
        longitude: selectedLocation.longitude || 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [selectedLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        onPress={handlePress}
        initialRegion={{
          latitude: initialPosition.latitude,
          longitude: initialPosition.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Display existing location markers */}
        {locations.map((location: any, index: any) => (
          <Marker
            key={index}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            onPress={() => onLocationClick(location)}
          >
            <View style={styles.markerContainer}>
              {location.imageUrl ? (
                <Image
                  source={{ uri: location.imageUrl }}
                  style={styles.markerImage}
                />
              ) : (
                <View style={styles.defaultMarker} />
              )}
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text variant="titleMedium">{location.name}</Text>
                {location.imageUrl && (
                  <Image
                    source={{ uri: location.imageUrl }}
                    style={styles.calloutImage}
                  />
                )}
                <Text variant="bodySmall">{location.streetAddress}</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Initial position marker */}
        <Marker
          coordinate={{
            latitude: initialPosition.latitude,
            longitude: initialPosition.longitude,
          }}
        >
          <View style={styles.markerContainer}>
            <View style={styles.defaultMarker} />
          </View>
          <Callout>
            <View style={styles.calloutContainer}>
              <Text variant="titleMedium">Current Location</Text>
            </View>
          </Callout>
        </Marker>

        {/* Marker for adding new location */}
        {isAddingLocation && marker && (
          <Marker coordinate={marker}>
            <View style={styles.newLocationMarker} />
          </Marker>
        )}

        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude || 0,
              longitude: selectedLocation.longitude || 0,
            }}
            pinColor="#FF0000"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: "center",
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
  },
  defaultMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5A5F",
    borderWidth: 2,
    borderColor: "white",
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4A90E2",
    borderWidth: 2,
    borderColor: "white",
  },
  newLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#50C878",
    borderWidth: 2,
    borderColor: "white",
  },
  calloutContainer: {
    width: 200,
    padding: 10,
    alignItems: "center",
  },
  calloutImage: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginVertical: 8,
  },
});
