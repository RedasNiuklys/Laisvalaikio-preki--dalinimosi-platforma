import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import WebMap from "./WebMap";
import { LocationMapProps, LocationMapRef } from "./LocationMap";
import { Location } from "../types/Location";

const defaultCoordinates = {
  latitude: 54.903929466398154,
  longitude: 23.957888105144654,
};

const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  (
    {
      selectedLocation = null,
      onLocationSelect,
      locations = [],
      onLocationClick = () => {},
      isAddingLocation = false,
    },
    ref
  ) => {
    const mapRef = useRef<google.maps.Map>(null);
    useImperativeHandle(ref, () => ({
      animateToLocation: (location: Location) => {
        if (mapRef.current) {
          mapRef.current.panTo({
            lat: location.latitude ?? 0,
            lng: location.longitude ?? 0,
          });
        }
      },
    }));

    return (
      <View style={{ flex: 1 }}>
        <WebMap
          selectedLocation={selectedLocation}
          initialPosition={{
            lat: selectedLocation?.latitude ?? defaultCoordinates.latitude,
            lng: selectedLocation?.longitude ?? defaultCoordinates.longitude,
          }}
          onLocationSelect={onLocationSelect}
          locations={locations}
          onLocationClick={onLocationClick}
          isAddingLocation={isAddingLocation}
        />
      </View>
    );
  }
);

export default LocationMap;
