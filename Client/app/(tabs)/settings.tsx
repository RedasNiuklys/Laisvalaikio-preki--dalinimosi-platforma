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
import CountryFlag from "react-native-country-flag";

import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import { useSettings } from "@/src/context/SettingsContext";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/src/i18n";

export default function SettingsScreen() {
  const theme = useTheme();
  const { logout, clearToken } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [dark, setDark] = useState(true);

  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);

    updateSettings({ ...settings, language });
  };
  const toggleTheme = () => {
    const newValue= !dark;
    setDark(!dark);
    AsyncStorage.setItem("isDarkMode", newValue.toString());
  };

  const clearCache = async () => {
    try {
      let allItems = await AsyncStorage.getAllKeys();
      await AsyncStorage.clear();
      await clearToken();

      showToast("success", t("settings.toast.cacheCleared"));

      setTimeout(() => {
        router.replace("/");
      }, 1000);
    } catch (error) {
      console.error("Error clearing cache:", error);
      showToast("error", t("settings.toast.cacheClearError"));
    } finally {
      setConfirmDialogVisible(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("success", t("settings.toast.logoutSuccess"));
    } catch (error) {
      console.error("Error logging out:", error);
      showToast("error", t("settings.toast.logoutError"));
    } finally {
      setLogoutDialogVisible(false);
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
            <CountryFlag isoCode="GB" size={24} style={{ marginRight: 8 }} />
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
            <CountryFlag isoCode="LT" size={24} style={{ marginRight: 8 }} />
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
        {t("settings.theme.title")}
      </Text>

      <View style={styles.settingRow}>
        <Text style={{ color: theme.colors.onBackground, marginRight: 10 }}>
          {t("settings.theme.darkMode")}
        </Text>
        <Switch value={dark} onValueChange={toggleTheme} />
      </View>

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
            <Button onPress={handleLogout} textColor={theme.colors.error}>
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
});
