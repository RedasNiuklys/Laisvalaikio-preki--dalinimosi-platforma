import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function ChatModalLayout() {
  const theme = useTheme();
  let ChatName = "Chat";
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        presentation: "modal",
      }}
    >
      <Stack.Screen
        name="list"
        options={{
          title: "Chats",
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "New Chat",
        }}
      />
      <Stack.Screen
        name={ChatName}
        options={{
          title: "Current Chat",
        }}
      />
    </Stack>
  );
}
