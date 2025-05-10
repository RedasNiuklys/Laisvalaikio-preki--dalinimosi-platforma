import { Stack, useSegments, useRouter, Slot } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { ToastContainer } from "@/src/components/Toast";
import GlobalHeader from "@/src/components/GlobalHeader";
import { View } from "react-native";
import { useEffect, useState } from "react";
import ThemeToggle from "@/src/components/ThemeToggle";

function NavigationStack() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Set navigation as ready after initial render
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!isNavigationReady || isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isNavigationReady, isLoading]);

  // Don't show header in auth screens
  const showHeader = segments[0] !== "(auth)";

  return (
    <View style={{ flex: 1 }}>
      {showHeader && <GlobalHeader />}
      {!showHeader && <ThemeToggle />}
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>

  );
}

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <SettingsProvider>
        <NavigationStack />
        <ToastContainer />
      </SettingsProvider>
    </PaperProvider>
  );
}
