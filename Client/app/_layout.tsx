import { Stack } from "expo-router";
import { useTheme, PaperProvider } from "react-native-paper";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { AuthProvider } from "@/src/context/AuthContext";
import { ToastContainer } from "@/src/components/Toast";
import { useProtectedRoute } from "@/src/hooks/useProtectedRoute";

function NavigationStack() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.onBackground,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(modals)"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="+not-found"
        options={{
          title: "Not Found",
        }}
      />
    </Stack>
  );
}

function ProtectedRoute() {
  // useProtectedRoute();
  return <NavigationStack />;
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <SettingsProvider>
        <AuthProvider>
          <ProtectedRoute />
          <ToastContainer />
        </AuthProvider>
      </SettingsProvider>
    </PaperProvider>
  );
}
