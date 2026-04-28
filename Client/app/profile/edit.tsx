import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import EditProfileScreen from "@/src/pages/profile/EditProfileScreen";

export default function EditProfileRoute() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("profile.editTitle", { defaultValue: "Edit profile" }),
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.onBackground,
        }}
      />
      <EditProfileScreen />
    </>
  );
}