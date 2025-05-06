import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function NotFoundScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if the route exists in the tabs layout
    const route = params.route as string;
    if (route && route.startsWith("/(tabs)")) {
      router.replace(route as any);
    }
  }, [params.route]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={{ color: theme.colors.onBackground }}
      >
        {t("errors.pageNotFound")}
      </Text>
      <Button
        mode="contained"
        onPress={() => router.replace("/(tabs)")}
        style={styles.button}
      >
        {t("navigation.goHome")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  button: {
    marginTop: 20,
  },
});
