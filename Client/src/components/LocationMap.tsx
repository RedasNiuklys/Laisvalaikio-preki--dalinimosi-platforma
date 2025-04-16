// LocationMap.tsx
import { Platform } from "react-native";

// This is just for type definitions, the actual implementation
// will be loaded from .web.tsx or .native.tsx
export default function LocationMap({
  locations,
  onLocationSelect,
  onAddLocation,
}: {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  onAddLocation: (location: Location) => void;
}) {
  return Platform.select({
    web: () => require("./LocationMap.web").default,
    default: () => require("./LocationMap.native").default,
  })();
}
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
