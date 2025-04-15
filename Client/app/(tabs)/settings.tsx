import { View, StyleSheet } from "react-native";
import { Text, Switch, useTheme } from "react-native-paper";
import { useTheme as useAppTheme } from "@/src/context/ThemeContext";

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useAppTheme();
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={{ color: theme.colors.onBackground }}
      >
        Settings
      </Text>
      <Text
        variant="bodyLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        Theme Settings
      </Text>

      <View style={styles.settingRow}>
        <Text style={{ color: theme.colors.onBackground, marginRight: 10 }}>
          Dark Mode
        </Text>
        <Switch value={isDarkMode} onValueChange={toggleTheme} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
});
