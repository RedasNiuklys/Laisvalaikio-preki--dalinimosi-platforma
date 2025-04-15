import React, { useState } from "react";
import { View } from "react-native";
import {
  Text,
  Button,
  ActivityIndicator,
  useTheme as usePaperTheme,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../api/users";
import { User } from "../types/User";
import { styles } from "../styles/ProfileScreen.styles";

const ProfileScreen = () => {
  const theme = usePaperTheme();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getProfile(); // Uses current user ID from auth token
      setUser(response);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUser();
      return () => {};
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading)
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  if (error) return <Text style={{ color: theme.colors.error }}>{error}</Text>;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={{ color: theme.colors.onBackground }}
      >
        Your Profile
      </Text>

      {user ? (
        <>
          <Text style={[styles.text, { color: theme.colors.onBackground }]}>
            Name: {user.name}
          </Text>
          <Text style={[styles.text, { color: theme.colors.onBackground }]}>
            Age: {user.age}
          </Text>
          <Text style={[styles.text, { color: theme.colors.onBackground }]}>
            Email: {user.email}
          </Text>
          <Text style={[styles.text, { color: theme.colors.onBackground }]}>
            Theme: {user.theme}
          </Text>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
          >
            Logout
          </Button>
        </>
      ) : (
        <Text style={{ color: theme.colors.error }}>
          No user data available
        </Text>
      )}
    </View>
  );
};

export default ProfileScreen;
