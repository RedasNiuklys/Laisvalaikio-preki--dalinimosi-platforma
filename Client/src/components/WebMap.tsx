import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Location } from "../types/Location";
import { GOOGLE_API_KEY } from "../utils/envConfig";

interface WebMapProps {
  onLocationSelect: (location: Location) => void;
  initialPosition?: { lat: number; lng: number };
  locations: Location[];
  onLocationClick: (location: Location) => void;
  isAddingLocation: boolean;
  selectedLocation: Location | null;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function WebMap({
  onLocationSelect,
  initialPosition,
  locations = [],
  onLocationClick,
  isAddingLocation = false,
  selectedLocation = null,
}: WebMapProps) {
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [currentPosition, setCurrentPosition] = useState(
    initialPosition || { lat: 54.903929466398154, lng: 23.957888105144654 }
  );

  // Get user's current location
  useEffect(() => {
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Error getting location:", error);
          // Keep default position if geolocation fails
        }
      );
    }
  }, [initialPosition]);

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      const mapInstance = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: currentPosition,
          zoom: 13,
          styles: [], // Can add dark mode styles here
        }
      );

      // Add click listener for adding locations
      mapInstance.addListener("click", (e: any) => {
        if (isAddingLocation) {
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
      });

      setMap(mapInstance);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete window.initMap;
    };
  }, [currentPosition]);

  // Update markers when locations or selectedLocation change
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: any[] = [];

    // Add initial position marker
    const initialMarker = new window.google.maps.Marker({
      position: currentPosition,
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#2ecc71",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
      },
    });
    newMarkers.push(initialMarker);

    // Add location markers
    locations.forEach((location) => {
      if (location.latitude && location.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor:
              selectedLocation?.id === location.id ? "#FF0000" : "#3498db",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          },
        });

        marker.addListener("click", () => onLocationClick(location));
        newMarkers.push(marker);
      }
    });

    // Add selected location marker if not in locations
    if (
      selectedLocation &&
      !locations.find((l) => l.id === selectedLocation.id)
    ) {
      const selectedMarker = new window.google.maps.Marker({
        position: {
          lat: selectedLocation.latitude || 0,
          lng: selectedLocation.longitude || 0,
        },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#FF0000",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
        },
      });
      newMarkers.push(selectedMarker);
    }

    setMarkers(newMarkers);
  }, [map, locations, selectedLocation, onLocationClick, isAddingLocation]);

  // Pan to selected location
  useEffect(() => {
    if (map && selectedLocation) {
      map.panTo({
        lat: selectedLocation.latitude || 0,
        lng: selectedLocation.longitude || 0,
      });
      map.setZoom(15);
    }
  }, [map, selectedLocation]);

  return (
    <View style={styles.container}>
      <div id="map" style={{ width: "100%", height: "100%" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
  },
});
