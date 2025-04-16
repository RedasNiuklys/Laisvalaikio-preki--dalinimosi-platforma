import { View, StyleSheet, Platform } from "react-native";
import {
  Text,
  Switch,
  useTheme,
  Button,
  Portal,
  Dialog,
  Divider,
} from "react-native-paper";
import { useTheme as useAppTheme } from "@/src/context/ThemeContext";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const { logout, clearToken } = useAuth();
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const clearCache = async () => {
    try {
      // Clear all AsyncStorage data
      let allItems = await AsyncStorage.getAllKeys();
      console.log("All items", allItems);
      await AsyncStorage.clear();

      // Force logout without going through the API
      await clearToken();

      showToast("success", "Cache cleared and logged out successfully");

      // Redirect to login screen using expo-router
      setTimeout(() => {
        router.replace("/");
      }, 1000);
    } catch (error) {
      console.error("Error clearing cache:", error);
      showToast("error", "Failed to clear cache");
    } finally {
      setConfirmDialogVisible(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("success", "Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      showToast("error", "Failed to log out");
    } finally {
      setLogoutDialogVisible(false);
    }
  };

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

      <Text
        variant="bodyLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        App Data
      </Text>

      <Button
        mode="outlined"
        onPress={() => setConfirmDialogVisible(true)}
        style={styles.button}
        icon="delete"
      >
        Clear Cache & Logout
      </Button>

      <Divider style={styles.divider} />

      <Text
        variant="bodyLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        Account
      </Text>

      <Button
        mode="outlined"
        onPress={() => setLogoutDialogVisible(true)}
        style={styles.button}
        icon="logout"
        textColor={theme.colors.error}
      >
        Force Logout
      </Button>

      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>Clear Cache & Logout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to clear all cached data and log out? This
              will remove all locally stored information and redirect you to the
              login screen.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={clearCache}>Clear & Logout</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>Force Logout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to log out? This will clear your
              authentication and redirect you to the login screen.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleLogout} textColor={theme.colors.error}>
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  button: {
    marginTop: 10,
  },
  divider: {
    marginVertical: 20,
  },
});
