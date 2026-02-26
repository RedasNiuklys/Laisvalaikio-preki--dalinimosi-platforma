import { Slot } from "expo-router";
import "@/src/i18n";
import { AuthProvider } from "@/src/context/AuthContext";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { ChatProvider } from "@/src/context/ChatContext";
import { PaperProvider, MD3LightTheme } from "react-native-paper";

// Static theme - no hooks
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#007AFF",
    secondary: "#5856D6",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    onSurface: "#1C1C1E",
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ChatProvider>
            <PaperProvider theme={lightTheme}>
              <Slot />
            </PaperProvider>
          </ChatProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
