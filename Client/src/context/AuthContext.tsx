// context/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { AuthContextType } from "../types/AuthContextType";
import { authApi } from "../api/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/User";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Singleton pattern: track if initial load has been performed
let initialLoadPromise: Promise<void> | null = null;

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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Singleton pattern: ensure initial auth check only happens once
    const performInitialLoad = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('firebaseToken');
        if (storedToken) {
          console.log("AuthContext: Token found in AsyncStorage, fetching user data...");
          setToken(storedToken);
          
          // Fetch user before setting authenticated to avoid empty state
          try {
            const userResponse = await authApi.getUser();
            console.log("AuthContext: ✓ User loaded successfully during initial load");
            setUser(userResponse);
            setIsAuthenticated(true);
          } catch (userError) {
            console.error("AuthContext: ❌ Failed to load user with cached token:", userError);
            // Token is stale or user data unavailable - clear auth state
            await AsyncStorage.removeItem('firebaseToken');
            await AsyncStorage.removeItem('firebaseUid');
            setToken(null);
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          console.log("AuthContext: No token found, user not authenticated");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    // Use singleton pattern to ensure this only runs once across all instances
    if (!initialLoadPromise) {
      initialLoadPromise = performInitialLoad();
    }
    initialLoadPromise.catch(err => console.error("Initial load promise error:", err));
  }, []);

  const loadUser = async () => {
    try {
      const response = await authApi.getUser();
      setUser(response);
      console.log("AuthContext: User loaded successfully");
    } catch (error) {
      console.error("AuthContext: Load user error:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string, provider?: string) => {
    try {
      console.log("AuthContext: Starting login...");
      const response = await authApi.login(email, password);
      
      console.log("AuthContext: Login returned, verifying token and fetching user...");
      // Verify token is actually in AsyncStorage before proceeding
      const storedToken = await AsyncStorage.getItem('firebaseToken');
      if (!storedToken) {
        console.error("AuthContext: ❌ Token not found in AsyncStorage after login!");
        throw new Error("Token storage failed - user not authenticated");
      }
      
      console.log("AuthContext: ✓ Token verified, loading user data...");
      // Load user BEFORE setting authenticated to ensure user exists
      try {
        await loadUser();
        setToken(storedToken);
        setIsAuthenticated(true);
        setAuthProvider("Email");
        console.log("AuthContext: ✓ User loaded and authenticated");
      } catch (userError) {
        console.error("AuthContext: ❌ Failed to load user after login:", userError);
        // Clear failed auth state
        await AsyncStorage.removeItem('firebaseToken');
        await AsyncStorage.removeItem('firebaseUid');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        throw new Error("Failed to load user profile after login");
      }
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string | null, lastName: string | null, theme: string = "light") => {
    try {
      console.log("AuthContext: Starting register...");
      const response = await authApi.register(email, password, firstName, lastName, theme);
      
      console.log("AuthContext: Register returned, verifying token and fetching user...");
      // Verify token is actually in AsyncStorage before proceeding
      const storedToken = await AsyncStorage.getItem('firebaseToken');
      if (!storedToken) {
        console.error("AuthContext: ❌ Token not found in AsyncStorage after register!");
        throw new Error("Token storage failed - user not authenticated");
      }
      
      console.log("AuthContext: ✓ Token verified, loading user data...");
      // Load user BEFORE setting authenticated to ensure user exists
      try {
        await loadUser();
        setToken(storedToken);
        setIsAuthenticated(true);
        setAuthProvider("Email");
        console.log("AuthContext: ✓ User loaded and authenticated");
      } catch (userError) {
        console.error("AuthContext: ❌ Failed to load user after register:", userError);
        // Clear failed auth state
        await AsyncStorage.removeItem('firebaseToken');
        await AsyncStorage.removeItem('firebaseUid');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        throw new Error("Failed to load user profile after registration");
      }
    } catch (error) {
      console.error("AuthContext: Register error:", error);
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      // Firebase listener will handle clearing auth state
      setAuthProvider("");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const clearToken = async () => {
    try {
      await authApi.logout();
      setToken(null);
      setIsAuthenticated(false);
      setAuthProvider("");
      setUser(null);
    } catch (error) {
      console.error("Clear token error:", error);
      throw error;
    }
  };

  const oauthLogin = async (provider: string = "OAuth") => {
    try {
      console.log("AuthContext: Starting OAuth login...");
      
      // Verify token is in AsyncStorage (should be set by OAuth handler)
      const storedToken = await AsyncStorage.getItem('firebaseToken');
      if (!storedToken) {
        console.error("AuthContext: ❌ Token not found in AsyncStorage after OAuth!");
        throw new Error("OAuth token not found - authentication failed");
      }
      
      console.log("AuthContext: ✓ OAuth token verified, loading user data...");
      
      // Load user data from backend
      try {
        await loadUser();
        setToken(storedToken);
        setIsAuthenticated(true);
        setAuthProvider(provider);
        console.log("AuthContext: ✓ User loaded and authenticated via OAuth");
      } catch (userError) {
        console.error("AuthContext: ❌ Failed to load user after OAuth:", userError);
        // Clear failed auth state
        await AsyncStorage.removeItem('firebaseToken');
        await AsyncStorage.removeItem('firebaseUid');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        throw new Error("Failed to load user profile after OAuth login");
      }
    } catch (error) {
      console.error("AuthContext: OAuth login error:", error);
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loadUser,
        login,
        register,
        oauthLogin,
        logout,
        clearToken,
        token,
        authProvider,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
