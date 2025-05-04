import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../../src/pages/ProfileScreen";
import UserFormScreen from "../../src/pages/UserFormScreen";
import { useTheme } from "react-native-paper";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/src/context/AuthContext";

export type ProfileStackParamList = {
  Profile: undefined;
  UserForm: { userId?: number } | undefined; // Optionally pass a userId for editing
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        console.warn("Camera and/or media library permissions not granted");
      }
    }
  };

  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onBackground,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Your Profile" }}
      />
      <Stack.Screen
        name="UserForm"
        component={UserFormScreen}
        options={{ title: "Edit Profile" }}
      />
    </Stack.Navigator>
  );
}
