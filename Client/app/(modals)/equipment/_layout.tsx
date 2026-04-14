import { Stack } from "expo-router";

export default function EquipmentModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
