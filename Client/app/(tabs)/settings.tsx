import {
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  Text,
  Switch,
  useTheme,
  Button,
  Portal,
  Dialog,
  List,
} from "react-native-paper";

import { useState } from "react";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const theme = useTheme();
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      setLogoutDialogVisible(false);
      showToast("success", t("settings.toast.logoutSuccess"));
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
