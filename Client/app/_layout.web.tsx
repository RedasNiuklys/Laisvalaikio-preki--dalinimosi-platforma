import { useSegments, useRouter, Slot } from "expo-router";
import "@/src/i18n";
import { PaperProvider } from "react-native-paper";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { ChatProvider } from "@/src/context/ChatContext";
import { ToastContainer } from "@/src/components/Toast";
import GlobalHeader from "@/src/components/GlobalHeader";
import { View, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import ThemeToggle from "@/src/components/ThemeToggle";
import LanguageToggle from "@/src/components/LanguageToggle";
import { spacing } from "@/src/styles/globalStyles";

const styles = StyleSheet.create({
  authHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
});

function NavigationStack() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = useState(false);

  // Wait for layout to mount before attempting navigation
  useEffect(() => {
    setNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!navigationReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Use setTimeout to defer navigation until after initial render
    const timeoutId = setTimeout(() => {
      // Redirect to login if not authenticated and not in auth group
      if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)/login");
      }
      // Redirect to tabs if authenticated and in auth group
      else if (isAuthenticated && inAuthGroup) {
        router.replace("/(tabs)");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, segments, navigationReady, router]);

  const showHeader = segments[0] !== "(auth)";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
        {showHeader && <GlobalHeader />}
        {!showHeader && (
          <View
            style={[
              styles.authHeader,
              {
                backgroundColor: theme.colors.background,
                paddingHorizontal: Platform.OS === "web" ? spacing.lg : spacing.md,
              },
            ]}
          >
            <LanguageToggle />
            <ThemeToggle />
          </View>
        )}
      </SafeAreaView>
      <Slot />
    </View>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();
  return (
    <PaperProvider theme={theme}>
      <NavigationStack />
      <ToastContainer />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ChatProvider>
            <RootLayoutNav />
          </ChatProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
