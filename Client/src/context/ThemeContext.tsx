import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { themes } from "../theme/GlobalTheme";




// 🌍 Define ThemeContext type
interface ThemeContextType {
  theme: ThemeType;
  updateTheme: (themeKey: string | null) => void;
  themes: Record<string, ThemeType>;
}

// Create context with proper types
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 🎯 Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(themes.Light);

  useEffect(() => {
  //   AsyncStorage.getItem("theme").then((storedTheme) => {
  //     if (storedTheme && themes[storedTheme]) {
  //       setTheme(themes[storedTheme]);
  //     }
  //   });
  },
   []);

  const updateTheme = (themeKey: string | null) => {
    let key = themeKey ? themeKey : 'light'
    if (themes[key]) {
      setTheme(themes[key]);
      // AsyncStorage.setItem("theme", themeKey); // 
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, themes }}>
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
