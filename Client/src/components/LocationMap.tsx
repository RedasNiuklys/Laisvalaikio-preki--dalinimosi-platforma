import { forwardRef } from "react";
import { Location, LocationFormData } from "../types/Location";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export interface LocationMapProps {
  locations?: Location[];
  selectedLocation?: LocationFormData | null;
  onLocationSelect: (location: LocationFormData) => void;
  onLocationClick?: (location: LocationFormData) => void;
  isAddingLocation?: boolean;
}

export interface LocationMapRef {
  animateToLocation: (location: Location) => void;
}

// This is just the interface file.
// The actual implementation is in LocationMap.web.tsx and LocationMap.native.tsx
const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  (props, ref) => null
);
export default LocationMap;
