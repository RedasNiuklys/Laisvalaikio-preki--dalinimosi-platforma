import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { PaperProvider } from "react-native-paper";

function AppContent() {
  const { theme } = useTheme();
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
