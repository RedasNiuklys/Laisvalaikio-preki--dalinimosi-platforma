import React, { useEffect } from "react";
import ProfileScreen from "../../src/pages/ProfileScreen";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";

export default function ProfileScreenWrapper() {
  const theme = useTheme();
  const { t } = useTranslation();

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
    <>
      <Stack.Screen
        options={{
          title: t("profile.title"),
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.onBackground,
        }}
      />
      <ProfileScreen />
    </>
  );
}
