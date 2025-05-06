import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface EditDeleteButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export default function EditDeleteButtons({
  onEdit,
  onDelete,
  editLabel = "common.buttons.edit",
  deleteLabel = "common.buttons.delete",
}: EditDeleteButtonsProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.actions}>
      <Button
        mode="text"
        onPress={onEdit}
        textColor={theme.colors.primary}
        icon={() => (
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={theme.colors.primary}
          />
        )}
      >
        {t(editLabel)}
      </Button>
      <Button
        mode="text"
        onPress={onDelete}
        textColor={theme.colors.error}
        icon={() => (
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={theme.colors.error}
          />
        )}
      >
        {t(deleteLabel)}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
