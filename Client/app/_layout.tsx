import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { PaperProvider } from "react-native-paper";
import { ToastContainer } from "@/src/components/Toast";
import { SettingsProvider } from "@/src/context/SettingsContext";
function AppContent() {
  const { theme } = useTheme();
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <SettingsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SettingsProvider>
        <ToastContainer />
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
