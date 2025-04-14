// context/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { AuthContextType } from "../types/AuthContextType";
import { ThemeProvider } from './ThemeContext';



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider ({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authProvider,setAuthProvider] = useState<string>('');

  const login = async (email: string, password: string, provider?: string) => {
    if (provider === 'OAuth') {
        // Handle OAuth logic here
        // Example: use OAuth 2.0 login method (e.g., react-native-app-auth)
        try {
          // OAuth login code here
          setIsAuthenticated(true);
          setAuthProvider('OAuth');
        } catch (error) {
          console.error("OAuth error", error);
          setIsAuthenticated(false);
        }
      } else {
        // Handle traditional login (email/password)
        try {
          // Traditional login API call logic here (e.g., Axios or Fetch)
          setIsAuthenticated(true);
          setAuthProvider('User');
        } catch (error) {
          console.error("Login error", error);
          setIsAuthenticated(false);
        }
      }
    };

  const register = async (email: string, password: string) => {
    // Perform registration logic (e.g., API call)
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
