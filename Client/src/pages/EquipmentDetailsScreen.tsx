import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
  Text,
  Button,
  Surface,
  useTheme,
  ActivityIndicator,
  Chip,
  Portal,
  Dialog,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { getById, deleteEquipment, update } from "../api/equipmentApi";
import { Equipment } from "../types/Equipment";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { showToast } from "../components/Toast";
import { useTranslation } from "react-i18next";

interface EquipmentDetailsScreenProps {
  equipmentId: string;
}

export default function EquipmentDetailsScreen({
  equipmentId,
}: EquipmentDetailsScreenProps) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    loadEquipment();
  }, [equipmentId]);

  const loadEquipment = async () => {
    try {
      const data = await getById(equipmentId);
      setEquipment(data);
    } catch (error) {
      console.error("Failed to load equipment:", error);
      showToast("error", t("equipment.details.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: "/(modals)/equipment/edit/[id]",
      params: { id: equipmentId },
    });
  };

  const handleDelete = async () => {
    try {
      await deleteEquipment(equipmentId);
      showToast("success", t("equipment.details.deleteSuccess"));
      router.back();
    } catch (error) {
      console.error("Failed to delete equipment:", error);
      showToast("error", t("equipment.details.deleteError"));
    }
  };

  const toggleAvailability = async () => {
    if (!equipment) return;

    try {
      const updatedEquipment = await update(equipmentId, {
        ...equipment,
        isAvailable: !equipment.isAvailable,
      });
      setEquipment(updatedEquipment);
      showToast("success", t("equipment.details.updateSuccess"));
    } catch (error) {
      console.error("Failed to update equipment:", error);
      showToast("error", t("equipment.details.updateError"));
    }
  };

  const nextImage = () => {
    if (equipment?.images) {
      setCurrentImageIndex((prev) =>
        prev === equipment.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (equipment?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? equipment.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>{t("equipment.details.notFound")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={styles.surface} elevation={2}>
        {equipment?.images && equipment.images.length > 0 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: equipment.images[currentImageIndex].imageUrl }}
              style={styles.image}
              contentFit="cover"
            />
            {equipment.images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navButton, styles.leftButton]}
                  onPress={previousImage}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={32}
                    color={theme.colors.onSurface}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navButton, styles.rightButton]}
                  onPress={nextImage}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={32}
                    color={theme.colors.onSurface}
                  />
                </TouchableOpacity>
                <View style={styles.imageCounter}>
                  <Text style={{ color: theme.colors.onSurface }}>
                    {currentImageIndex + 1} / {equipment.images.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.content}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            {equipment.name}
          </Text>

          <View style={styles.chips}>
            <Chip
              style={[
                styles.chip,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
              textStyle={{ color: theme.colors.primary }}
              icon={() => (
                <MaterialCommunityIcons
                  name="tag"
                  size={16}
                  color={theme.colors.primary}
                />
              )}
            >
              {equipment.category}
            </Chip>

            <Chip
              style={[
                styles.chip,
                {
                  backgroundColor: equipment.isAvailable
                    ? theme.colors.primaryContainer
                    : theme.colors.errorContainer,
                },
              ]}
              textStyle={{
                color: equipment.isAvailable
                  ? theme.colors.primary
                  : theme.colors.error,
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name={equipment.isAvailable ? "check-circle" : "close-circle"}
                  size={16}
                  color={
                    equipment.isAvailable
                      ? theme.colors.primary
                      : theme.colors.error
                  }
                />
              )}
            >
              {equipment.isAvailable
                ? t("equipment.available")
                : t("equipment.unavailable")}
            </Chip>
          </View>

          <Text
            variant="bodyLarge"
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {equipment.description}
          </Text>

          {user?.id === equipment.ownerId && (
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={toggleAvailability}
                style={styles.button}
              >
                {equipment.isAvailable
                  ? t("equipment.details.markUnavailable")
                  : t("equipment.details.markAvailable")}
              </Button>
              <Button
                mode="contained"
                onPress={handleEdit}
                style={styles.button}
              >
                {t("equipment.details.edit")}
              </Button>
              <Button
                mode="contained"
                onPress={() => setDeleteDialogVisible(true)}
                buttonColor={theme.colors.error}
                style={styles.button}
              >
                {t("equipment.details.delete")}
              </Button>
            </View>
          )}
        </View>
      </Surface>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>
            {t("equipment.details.deleteConfirmTitle")}
          </Dialog.Title>
          <Dialog.Content>
            <Text>{t("equipment.details.deleteConfirmMessage")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              {t("common.buttons.cancel")}
            </Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              {t("common.buttons.delete")}
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
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  surface: {
    margin: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 500,
    position: "relative",
    alignSelf: "center",
    maxWidth: 500,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 8,
  },
  leftButton: {
    left: 8,
  },
  rightButton: {
    right: 8,
  },
  imageCounter: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
  },
  actions: {
    gap: 8,
  },
  button: {
    marginBottom: 8,
  },
});
