import React, { useState, useEffect, useRef } from "react";
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
    __googleMapsLoaderPromise?: Promise<any>;
  }
}

const loadGoogleMapsApi = (): Promise<any> => {
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (window.__googleMapsLoaderPromise) {
    return window.__googleMapsLoaderPromise;
  }

  window.__googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-google-maps-loader="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () => {
        window.__googleMapsLoaderPromise = undefined;
        reject(new Error("Failed to load Google Maps script"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";

    script.onload = () => resolve(window.google);
    script.onerror = () => {
      window.__googleMapsLoaderPromise = undefined;
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoaderPromise;
};

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
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const isAddingLocationRef = useRef(isAddingLocation);
  const onLocationSelectRef = useRef(onLocationSelect);
  const [currentPosition, setCurrentPosition] = useState(
    initialPosition || { lat: 54.903929466398154, lng: 23.957888105144654 }
  );

  useEffect(() => {
    isAddingLocationRef.current = isAddingLocation;
  }, [isAddingLocation]);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMountedRef.current) {
            setCurrentPosition({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          }
        },
        (error) => {
          console.log("Error getting location:", error);
          // Keep default position if geolocation fails
        }
      );
    }
  }, [initialPosition]);

  useEffect(() => {
    let isCancelled = false;

    const initializeMap = async () => {
      try {
        const googleApi = await loadGoogleMapsApi();
        if (isCancelled || !mapElementRef.current || map) {
          return;
        }

        const mapInstance = new googleApi.maps.Map(mapElementRef.current, {
          center: currentPosition,
          zoom: 13,
          styles: [],
        });

        mapInstance.addListener("click", (e: any) => {
          if (isAddingLocationRef.current) {
            const newLocation: Location = {
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng(),
              name: "",
              streetAddress: "",
              city: "",
              country: "",
              userId: "",
            };
            onLocationSelectRef.current(newLocation);
          }
        });

        if (isMountedRef.current) {
          setMap(mapInstance);
        }
      } catch (error) {
        console.error("Failed to initialize Google Maps:", error);
      }
    };

    initializeMap();

    return () => {
      isCancelled = true;
    };
  }, [currentPosition, map]);

  useEffect(() => {
    if (map) {
      map.setCenter(currentPosition);
    }
  }, [map, currentPosition]);

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
      <div ref={mapElementRef} style={{ width: "100%", height: "100%" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
  },
});
