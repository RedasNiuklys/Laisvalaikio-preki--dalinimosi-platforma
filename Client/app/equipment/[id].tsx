import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Image } from "react-native";
import {
  Text,
  useTheme,
  ActivityIndicator,
  Card,
  IconButton,
  Button,
} from "react-native-paper";
import {
  useLocalSearchParams,
  useNavigation,
  Stack,
  router,
} from "expo-router";
import { useTranslation } from "react-i18next";
import { Equipment } from "@/src/types/Equipment";
import * as equipmentApi from "@/src/api/equipmentApi";
import * as userApi from "@/src/api/userApi";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import DateSelector from "@/src/components/DateSelector";
import { format } from "date-fns";
import { User } from "@/src/types/User";

const { width: screenWidth } = Dimensions.get("window");

export default function EquipmentCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<User | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    fetchEquipment();
  }, [id]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data = await equipmentApi.getById(id);
      setEquipment(data);
      const owner = await userApi.getUserById(data.ownerId);
      setOwner(owner);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      showToast("error", t("equipment.errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousImage = () => {
    if (equipment?.images && equipment.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? equipment.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (equipment?.images && equipment.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === equipment.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text>{t("equipment.errors.notFound")}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("equipment.details.title"),
          headerShown: true,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Image Slider */}
        {equipment.images && equipment.images.length > 0 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: equipment.images[currentImageIndex].imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
            {equipment.images.length > 1 && (
              <>
                <IconButton
                  icon="chevron-left"
                  size={30}
                  onPress={handlePreviousImage}
                  style={[styles.navButton, styles.leftButton]}
                />
                <IconButton
                  icon="chevron-right"
                  size={30}
                  onPress={handleNextImage}
                  style={[styles.navButton, styles.rightButton]}
                />
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {equipment.images.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.content}>
          {/* Basic Information */}
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="headlineMedium">{equipment.name}</Text>
              <Text variant="bodyLarge" style={styles.description}>
                {equipment.description}
              </Text>
              <Text variant="bodyMedium">
                {t("equipment.details.category")}: {equipment.category}
              </Text>
              <Text variant="bodyMedium">
                {t("equipment.details.condition")}: {equipment.condition}
              </Text>
              <Text variant="bodyMedium">
                {t("equipment.details.owner")}: {owner?.name}
              </Text>
            </Card.Content>
          </Card>

          {/* Location Information */}
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium">{t("location.title")}</Text>
              <Text variant="bodyMedium">{equipment.location.name}</Text>
              <Text variant="bodyMedium">
                {equipment.location.streetAddress}
              </Text>
              <Text variant="bodyMedium">
                {equipment.location.city}, {equipment.location.country}
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  // TODO: Implement map navigation
                }}
                icon="map-marker"
                style={styles.mapButton}
              >
                {t("location.showOnMap")}
              </Button>
            </Card.Content>
          </Card>

          {/* Used Dates */}
          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium">
                {t("equipment.details.usedDates")}
              </Text>
              <DateSelector
                equipmentId={equipment.id}
                onDateSelect={(startDate, endDate) => {
                  // Handle date selection
                }}
              />
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => router.push(`/equipment/edit/${equipment.id}`)}
              icon="pencil"
              style={styles.actionButton}
            >
              {t("common.buttons.edit")}
            </Button>
            <Button
              mode="contained-tonal"
              onPress={() => router.push("/equipment")}
              icon="arrow-left"
              style={styles.actionButton}
            >
              {t("common.buttons.back")}
            </Button>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: screenWidth,
    height: 450,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
  },
  leftButton: {
    left: 10,
  },
  rightButton: {
    right: 10,
  },
  imageCounter: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  imageCounterText: {
    color: "white",
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  description: {
    marginVertical: 8,
  },
  mapButton: {
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
