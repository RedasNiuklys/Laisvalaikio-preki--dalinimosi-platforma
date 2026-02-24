import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { colors } from '@/src/styles/globalStyles';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUserThemePreference } from "@/src/api/userApi";

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.light,
    surface: colors.white,
    onSurface: colors.dark,
    error: colors.danger,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.dark,
    surface: colors.charcoal,
    onSurface: colors.light,
    error: colors.danger,
  },
};

type ThemeContextType = {
  theme: typeof MD3LightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeFromPreference: (isDark: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    try {
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");

      // Try to update theme in database if user is authenticated
      try {
        await updateUserThemePreference(newTheme ? "dark" : "light");
      } catch (error) {
        // User might not be authenticated yet - that's okay
        console.debug("Theme sync skipped - user not authenticated");
      }
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const setThemeFromPreference = async (isDark: boolean) => {
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setThemeFromPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 🎨 Custom hook for using the theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
