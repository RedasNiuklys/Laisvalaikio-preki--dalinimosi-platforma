import LocationListScreen from "@/src/pages/LocationListScreen";
import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function LocationsScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.onBackground,
        }}
      />
      <LocationListScreen />
    </>
  );
}
