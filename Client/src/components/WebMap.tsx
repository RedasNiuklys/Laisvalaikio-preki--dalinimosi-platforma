import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Map, Marker } from "pigeon-maps";
import { Location } from "../types/Location";

export default function WebMap({
  onLocationSelect,
  initialPosition = { lat: 54.903929466398154, lng: 23.957888105144654 },
  locations = [],
  onLocationClick,
  isAddingLocation = false,
  selectedLocation = null,
}: {
  onLocationSelect: (coordinates: any) => void;
  initialPosition?: { lat: number; lng: number };
  locations: Location[];
  onLocationClick: (location: Location) => void;
  isAddingLocation: boolean;
  selectedLocation: Location | null;
}) {
  const [center, setCenter] = useState([
    initialPosition.lat,
    initialPosition.lng,
  ]);
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (selectedLocation) {
      // Update center when selected location changes
      setCenter([
        selectedLocation.latitude || 0,
        selectedLocation.longitude || 0,
      ]);
      setZoom(15); // Zoom in closer when location is selected
    }
  }, [selectedLocation]);

  const handleClick = ({ latLng, event }: { latLng: number[]; event: any }) => {
    if (isAddingLocation) {
      onLocationSelect({
        latitude: latLng[0],
        longitude: latLng[1],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Map
        height={400}
        center={center as [number, number]}
        zoom={zoom}
        onClick={handleClick}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
      >
        {/* Display existing location markers */}
        {locations.map((location, index) => (
          <Marker
            key={index}
            width={50}
            anchor={[location.latitude || 0, location.longitude || 0]}
            onClick={() => onLocationClick(location)}
            color={selectedLocation?.id === location.id ? "#FF0000" : "#3498db"}
          />
        ))}

        {/* Initial position marker */}
        <Marker
          width={50}
          anchor={[initialPosition.lat, initialPosition.lng]}
          color="#2ecc71"
        />

        {/* Selected location marker (if not in locations array) */}
        {selectedLocation &&
          !locations.find((l) => l.id === selectedLocation.id) && (
            <Marker
              width={50}
              anchor={[
                selectedLocation.latitude || 0,
                selectedLocation.longitude || 0,
              ]}
              color="#FF0000"
            />
          )}
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
  },
});
