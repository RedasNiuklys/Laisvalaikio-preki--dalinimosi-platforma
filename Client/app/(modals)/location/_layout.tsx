import { Stack } from "expo-router";

export default function LocationModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      <Stack.Screen name="add-location" />
    </Stack>
  );
}
