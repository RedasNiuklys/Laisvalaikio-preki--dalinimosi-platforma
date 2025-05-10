import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Location } from "../types/Location";
import { GOOGLE_API_KEY } from "../utils/envConfig";
import { useTheme } from "react-native-paper";

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

const containerStyle = {
  width: "100%",
  height: "400px",
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

interface WebMapProps {
  onLocationSelect: (location: Location) => void;
  initialPosition?: { lat: number; lng: number };
  locations: Location[];
  onLocationClick: (location: Location) => void;
  isAddingLocation: boolean;
  selectedLocation: Location | null;
}

export default function WebMap({
  onLocationSelect,
  initialPosition = { lat: 54.903929466398154, lng: 23.957888105144654 },
  locations = [],
  onLocationClick,
  isAddingLocation = false,
  selectedLocation = null,
}: WebMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_API_KEY,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(initialPosition);
  const [zoom, setZoom] = useState(13);
  const theme = useTheme();
  const isDark = theme.dark;

  React.useEffect(() => {
    if (selectedLocation) {
      setCenter({
        lat: selectedLocation.latitude || 0,
        lng: selectedLocation.longitude || 0,
      });
      setZoom(15);
    }
  }, [selectedLocation]);

  const handleClick = (e: google.maps.MapMouseEvent) => {
    if (isAddingLocation && e.latLng) {
      const newLocation: Location = {
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng(),
        name: "",
        streetAddress: "",
        city: "",
        country: "",
        userId: "",
      };
      onLocationSelect(newLocation);
    }
  };

  const onLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded)
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onClick={handleClick}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
          styles: isDark ? mapStyles.dark : mapStyles.light,
        }}
      >
        {/* Display existing location markers */}
        {locations.map((location, index) =>
          location.latitude && location.longitude ? (
            <Marker
              key={index}
              position={{
                lat: location.latitude || 0,
                lng: location.longitude || 0,
              }}
              onClick={() => onLocationClick(location)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor:
                  selectedLocation?.id === location.id ? "#FF0000" : "#3498db",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
              }}
            />
          ) : null
        )}

        {/* Initial position marker */}
        <Marker
          position={initialPosition}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2ecc71",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          }}
        />

        {/* Selected location marker (if not in locations array) */}
        {selectedLocation &&
          !locations.find((l) => l.id === selectedLocation.id) && (
            <Marker
              position={{
                lat: selectedLocation.latitude || 0,
                lng: selectedLocation.longitude || 0,
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#FF0000",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
              }}
            />
          )}
      </GoogleMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
  },
});
