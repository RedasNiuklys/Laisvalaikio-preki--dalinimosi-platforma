import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import {getUserById} from "../api/users"
import {User} from "../types/User"


const ProfileScreen = () => {
  const { theme, updateTheme } = useTheme();
  const navigation = useNavigation();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserById(1); // Adjust API endpoint
        setUser(response);
        // updateTheme(response.data.theme); // Automatically set theme from user data
      } catch (err) {
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <ActivityIndicator size="large" color={theme.ctaButtonColor} />;
  if (error) return <Text style={{ color: theme.errorColor }}>{error}</Text>;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundColor }}>
      <Text style={{ fontSize: 24, color: theme.primaryTextColor }}>Your Profile</Text>

      {user ? (
        <>
          <Text style={{ color: theme.primaryTextColor, marginTop: 10 }}>Name: {user.name}</Text>
          <Text style={{ color: theme.primaryTextColor, marginTop: 5 }}>Age: {user.age}</Text>
          <Text style={{ color: theme.primaryTextColor, marginTop: 5 }}>Email: {user.email}</Text>
          <Text style={{ color: theme.primaryTextColor, marginTop: 5 }}>Theme: {user.theme}</Text>

          {/* Button to Edit Profile */}
          {/* <Button title="Edit Profile" onPress={() => navigation.navigate("UserFormScreen", { userId: user.id })} /> */}
        </>
      ) : (
        <Text style={{ color: theme.errorColor }}>No user data available</Text>
      )}
    </View>
  );
};

export default ProfileScreen;
