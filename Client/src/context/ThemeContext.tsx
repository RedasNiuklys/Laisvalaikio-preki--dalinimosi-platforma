import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { lightTheme, darkTheme } from "../theme/PaperTheme";
import { MD3Theme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🌍 Define ThemeContext type
interface ThemeContextType {
  theme: MD3Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Create context with proper types
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 🎯 Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem("isDarkMode").then((value) => {
      if (value !== null) {
        setIsDarkMode(value === "true");
      }
    });
  }, []);

  const toggleTheme = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    AsyncStorage.setItem("isDarkMode", newValue.toString());
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 🎨 Custom hook for using the theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
