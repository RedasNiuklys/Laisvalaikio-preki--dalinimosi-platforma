import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { colors } from '@/src/styles/globalStyles';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { getProfile, updateUserThemePreference } from "@/src/api/userApi";

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

// 🌍 Define ThemeContext type
type ThemeContextType = {
  theme: typeof MD3LightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeFromPreference: (isDark: boolean) => void;
};

// Create context with proper types
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 🎯 Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");
  const { user, isAuthenticated } = useAuth();

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme) {
          setIsDarkMode(savedTheme === "dark");
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };
    loadTheme();
  }, []);

  // Load user's theme preference from database when authenticated
  useEffect(() => {
    const loadUserTheme = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await getProfile();

          if (response?.theme) {
            const isDark = response.theme === "dark";
            setIsDarkMode(isDark);
            await AsyncStorage.setItem("theme", response.theme);
          }
        } catch (error) {
          console.error("Error loading user theme:", error);
        }
      }
    };
    loadUserTheme();
  }, [isAuthenticated, user]);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    try {
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");

      // Update theme in database if user is authenticated
      if (isAuthenticated && user) {
        await updateUserThemePreference(user.id as string, newTheme ? "dark" : "light");
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
