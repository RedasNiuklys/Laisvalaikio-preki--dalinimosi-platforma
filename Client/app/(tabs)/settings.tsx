import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Switch,
  useTheme,
  Button,
  Portal,
  Dialog,
  Divider,
  List,
  RadioButton,
} from "react-native-paper";

import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/src/i18n";
import { useRouter } from "expo-router";
import { globalStyles } from "@/src/styles/globalStyles";
import { authApi } from "@/src/api/auth";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const theme = useTheme();
  const router = useRouter();
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);

    updateSettings({ ...settings, language });
  };

  const clearCache = async () => {
    try {
      await logout();
      let allItems = await AsyncStorage.getAllKeys();
      await AsyncStorage.clear();

      showToast("success", t("settings.toast.cacheCleared"));

      // Sign out after clearing cache
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error clearing cache:", error);
      showToast("error", t("settings.toast.cacheClearError"));
    } finally {
      setConfirmDialogVisible(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setLogoutDialogVisible(false);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error signing out:", error);
      showToast("error", t("settings.toast.logoutError"));
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={{ color: theme.colors.onBackground }}
      >
        {t("settings.title")}
      </Text>

      <Text
        variant="bodyLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        {t("settings.calendar.preferences")}
      </Text>

      <List.Item
        title={t("settings.calendar.startWeekMonday")}
        description={t("settings.calendar.startWeekMondayDesc")}
        right={(props) => (
          <Switch
            value={settings.startWeekOnMonday}
            onValueChange={(value) =>
              updateSettings({ ...settings, startWeekOnMonday: value })
            }
          />
        )}
      />

      <Text
        variant="bodyLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        {t("settings.language.title")}
      </Text>

      <RadioButton.Group
        value={settings.language}
        onValueChange={(value) => {
          handleLanguageChange(value);
          updateSettings({ ...settings, language: value });
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => {
              handleLanguageChange("en");
              updateSettings({ ...settings, language: "en" });
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 8 }}>🇬🇧</Text>
            <RadioButton
              value="en"
              status={settings.language === "en" ? "checked" : "unchecked"}
              onPress={() => {
                handleLanguageChange("en");
                updateSettings({ ...settings, language: "en" });
              }}
            />
            <Text style={{ color: theme.colors.onBackground }}>
              {t("settings.language.english")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => {
              handleLanguageChange("lt");
              updateSettings({ ...settings, language: "lt" });
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 8 }}>🇱🇹</Text>
            <RadioButton
              value="lt"
              status={settings.language === "lt" ? "checked" : "unchecked"}
              onPress={() => {
                handleLanguageChange("lt");
                updateSettings({ ...settings, language: "lt" });
              }}
            />
            <Text style={{ color: theme.colors.onBackground }}>
              {t("settings.language.lithuanian")}
            </Text>
          </TouchableOpacity>
        </View>
      </RadioButton.Group>

      <Text
        variant="bodyLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        {t("settings.appData.title")}
      </Text>

      <Button
        mode="outlined"
        onPress={() => setConfirmDialogVisible(true)}
        style={styles.button}
        icon="delete"
      >
        {t("settings.appData.clearCache")}
      </Button>

      <Divider style={styles.divider} />

      <Text
        variant="bodyLarge"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        {t("settings.account.title")}
      </Text>

      <Button
        mode="outlined"
        onPress={() => setLogoutDialogVisible(true)}
        style={styles.button}
        icon="logout"
        textColor={theme.colors.error}
      >
        {t("settings.account.forceLogout")}
      </Button>

      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>{t("settings.appData.clearCache")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t("settings.appData.clearCacheConfirm")}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>
              {t("common.buttons.cancel")}
            </Button>
            <Button onPress={clearCache}>{t("common.buttons.clear")}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>{t("settings.account.forceLogout")}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t("settings.account.logoutConfirm")}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              {t("common.buttons.cancel")}
            </Button>
            <Button onPress={handleSignOut} textColor={theme.colors.error}>
              {t("common.buttons.logout")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
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
  versionContainer: {
    padding: 16,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
