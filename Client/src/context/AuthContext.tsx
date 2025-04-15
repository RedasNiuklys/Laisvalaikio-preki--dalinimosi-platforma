// context/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { AuthContextType } from "../types/AuthContextType";
import { authApi } from "../api/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authProvider, setAuthProvider] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for token in AsyncStorage on initial load
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
          console.log("Stored token:", storedToken);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error loading token:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email: string, password: string, provider?: string) => {
    try {
      if (provider === "Google") {
        authApi.googleLogin();
        return;
      } else if (provider === "Facebook") {
        authApi.facebookLogin();
        return;
      } else {
        const response = await authApi.login(email, password);
        const { token } = response;
        setToken(token);
        await AsyncStorage.setItem("token", token);
        setIsAuthenticated(true);
        setAuthProvider("User");
      }
    } catch (error) {
      console.error("Login error", error);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await authApi.register(email, password);
      const { token } = response;
      setToken(token);
      await AsyncStorage.setItem("token", token);
      setIsAuthenticated(true);
      setAuthProvider("User");
    } catch (error) {
      console.error("Registration error", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Set the current token before logout
      const currentToken = await AsyncStorage.getItem("token");
      if (currentToken) {
        setToken(currentToken);
      }

      // Call the logout endpoint
      await authApi.logout();

      // Clear the token and auth state
      await AsyncStorage.removeItem("token");
      setToken(null);
      setIsAuthenticated(false);
      setAuthProvider("");
    } catch (error) {
      console.error("Logout error", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        register,
        logout,
        token,
        authProvider,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
