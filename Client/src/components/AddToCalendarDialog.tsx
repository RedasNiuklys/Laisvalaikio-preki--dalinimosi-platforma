import React, { useState } from "react";
import { Linking } from "react-native";
import { Modal, Portal, Text, Button, ActivityIndicator, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Booking } from "../types/Booking";
import {
  CalendarMode,
  buildEventDetails,
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  addToDeviceCalendar,
} from "../utils/calendarUtils";
import { showToast } from "./Toast";

interface AddToCalendarDialogProps {
  visible: boolean;
  onDismiss: () => void;
  booking: Booking;
  equipmentName: string;
  calendarMode: CalendarMode;
}

export default function AddToCalendarDialog({
  visible,
  onDismiss,
  booking,
  equipmentName,
  calendarMode,
}: AddToCalendarDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const event = buildEventDetails(booking, equipmentName);

  const handleNative = async (preferGoogle: boolean) => {
    setLoading(true);
    const result = await addToDeviceCalendar(event, preferGoogle);
    setLoading(false);
    if (result === "success") {
      showToast("success", t("addToCalendar.success"));
    } else if (result === "permission_denied") {
      showToast("info", t("addToCalendar.permissionDenied"));
    } else {
      showToast("error", t("addToCalendar.error"));
    }
    onDismiss();
  };

  const handleWebUrl = async (url: string) => {
    await Linking.openURL(url);
    onDismiss();
  };

  const containerStyle = {
    backgroundColor: theme.colors.surface,
    padding: 24,
    margin: 24,
    borderRadius: 12,
    gap: 12 as const,
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={containerStyle}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {t("addToCalendar.title")}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("addToCalendar.subtitle")}
        </Text>

        {loading ? (
          <ActivityIndicator animating color={theme.colors.primary} />
        ) : (
          <>
            {(calendarMode === "android_google" || calendarMode === "ios_google") && (
              <Button mode="contained" onPress={() => handleNative(true)}>
                {t("addToCalendar.addGoogle")}
              </Button>
            )}

            {calendarMode === "ios_microsoft" && (
              <Button mode="contained" onPress={() => handleNative(false)}>
                {t("addToCalendar.addOutlook")}
              </Button>
            )}

            {calendarMode === "ios_generic" && (
              <Button mode="contained" onPress={() => handleNative(false)}>
                {t("addToCalendar.addGeneric")}
              </Button>
            )}

            {(calendarMode === "web_google" || calendarMode === "web_both") && (
              <Button
                mode="contained"
                onPress={() => handleWebUrl(buildGoogleCalendarUrl(event))}
              >
                {t("addToCalendar.addGoogle")}
              </Button>
            )}

            {(calendarMode === "web_microsoft" || calendarMode === "web_both") && (
              <Button
                mode="outlined"
                onPress={() => handleWebUrl(buildOutlookCalendarUrl(event))}
              >
                {t("addToCalendar.addOutlook")}
              </Button>
            )}

            <Button mode="text" onPress={onDismiss}>
              {t("addToCalendar.skip")}
            </Button>
          </>
        )}
      </Modal>
    </Portal>
  );
}
