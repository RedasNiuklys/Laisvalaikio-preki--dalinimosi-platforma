import { useCallback } from "react";
import { View, StyleSheet, BackHandler, Alert, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }

      const onBackPress = () => {
        Alert.alert(
          t("common.exit.title", { defaultValue: "Close app?" }),
          t("common.exit.message", {
            defaultValue: "Do you want to close the app?",
          }),
          [
            {
              text: t("common.cancel", { defaultValue: "Cancel" }),
              style: "cancel",
            },
            {
              text: t("common.exit.action", { defaultValue: "Close" }),
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );

        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [t])
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={{ color: theme.colors.onBackground }}
      >
        {t("home.welcome")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
