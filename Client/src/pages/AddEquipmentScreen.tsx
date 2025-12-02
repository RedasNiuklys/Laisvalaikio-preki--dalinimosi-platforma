import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import {
  CreateEquipmentDto,
  Equipment,
  UpdateEquipmentDto,
} from "../types/Equipment";
import { EquipmentImage } from "../types/EquipmentImage";
import { Location } from "../types/Location";
import { Category } from "../types/Category";
import { getByOwner } from "../api/locationApi";
import { create, uploadImage, getById, update } from "../api/equipmentApi";
import { getCategories } from "../api/categoryApi";
import { useAuth } from "../context/AuthContext";
import { Picker } from "@react-native-picker/picker";
import LocationFormScreen from "./LocationFormScreen";
import { ImageList } from "../components/ImageList";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

type AddEquipmentScreenProps = {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  equipmentId?: string;
};

export default function AddEquipmentScreen({
  initialLocation,
  equipmentId,
}: AddEquipmentScreenProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [equipmentImages, setEquipmentImages] = useState<EquipmentImage[]>([]);
  const [equipment, setEquipment] = useState<UpdateEquipmentDto>({
    name: "",
    description: "",
    locationId: "",
    condition: "Good",
    category: { id: 0, name: "", iconName: "", categoryId: 0 },
    IsAvailable: true,
  });

  useEffect(() => {
    loadCategories();
    if (equipmentId) {
      loadEquipment();
    }
  }, [equipmentId]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await getById(equipmentId!);
      setEquipment({
        name: data.name,
        description: data.description,
        locationId: data.locationId,
        condition: data.condition,
        category: data.category,
        IsAvailable: data.IsAvailable,
      });
      setSelectedLocationId(data.locationId);
      setSelectedCategoryId(
        categories.findIndex((c) => c.name === data.category.name) + 1
      );
      if (data.images) {
        setEquipmentImages(data.images);
        setImageUrls(data.images.map((img) => img.url));
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("equipment.form.errors.loadFailed"),
      });
    }
  };

  const loadLocations = async () => {
    try {
      if (user?.id) {
        const data = await getByOwner(user.id);
        setLocations(data);
      }
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleCreateLocation = () => {
    setShowLocationForm(true);
  };

  const handleLocationCreated = async () => {
    setShowLocationForm(false);
    const updatedLocations = await getByOwner(user?.id || "");
    setLocations(updatedLocations);

    // Select the newly created location
    if (updatedLocations.length > 0) {
      const lastLocation = updatedLocations[updatedLocations.length - 1];
      if (lastLocation.id) {
        setSelectedLocationId(lastLocation.id);
      }
    }
  };

  if (showLocationForm) {
    return (
      <View style={styles.container}>
        <LocationFormScreen
          initialCoordinates={initialLocation}
          isEditing={false}
          onSubmitSuccess={handleLocationCreated}
        />
      </View>
    );
  }

  const handleAddImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: t("equipment.form.errors.permissionNeeded"),
          text2: t("equipment.form.errors.photoPermission"),
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = await Promise.all(
          result.assets.map(async (asset) => {
            let imageUrl = asset.uri;

            // Only handle file system operations on native platforms
            if (Platform.OS !== "web") {
              const fileName = `tempimage.jpg`;
              const filePath = `${FileSystem.cacheDirectory}${fileName}`;

              // Copy the image to cache directory
              await FileSystem.copyAsync({
                from: asset.uri,
                to: filePath,
              });

              imageUrl = filePath;
            }

            const newImage: EquipmentImage = {
              id: "", // This will be set by the server
              equipmentId: "", // This will be set when equipment is created
              url: imageUrl,
              isMain: equipmentImages.length === 0, // First image is main by default
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            return newImage;
          })
        );

        setEquipmentImages([...equipmentImages, ...newImages]);
        setImageUrls([...imageUrls, ...newImages.map((img) => img.url)]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("equipment.form.errors.pickImage"),
      });
    }
  };

  const handleRemoveImage = async (index: number) => {
    try {
      const imageToRemove = equipmentImages[index];

      // Only handle file system operations on native platforms
      if (
        Platform.OS !== "web" &&
        imageToRemove.url.startsWith(FileSystem.cacheDirectory || "")
      ) {
        await FileSystem.deleteAsync(imageToRemove.url, {
          idempotent: true,
        });
      }

      setEquipmentImages(equipmentImages.filter((_, i) => i !== index));
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing image:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("equipment.form.errors.removeImage"),
      });
    }
  };

  const handleSubmit = async () => {
    console.log("handleSubmit");
    if (
      !equipment.name ||
      !equipment.description ||
      !selectedLocationId ||
      !user?.id ||
      !selectedCategoryId
    ) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("equipment.form.errors.requiredFields"),
      });
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories[selectedCategoryId - 1];
      console.log("selectedCategory", selectedCategory);
      if (!selectedCategory) {
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("equipment.form.errors.invalidCategory"),
        });
        return;
      }
      //console.log
      const equipmentData: UpdateEquipmentDto = {
        name: equipment.name,
        description: equipment.description,
        locationId: selectedLocationId,
        category: selectedCategory,
        condition: equipment.condition,
        IsAvailable: equipment.IsAvailable,
      };
      console.log("equipmentData", equipmentData);
      console.log("equipmentImages", equipmentImages);
      console.log("equipmentId", equipmentId);

      //console.log
      // "Equipment data:", equipmentId;
      if (equipmentId) {
        // // Update existing equipment
        // //console.log
        // "Updating equipment:", equipmentId;
        // //console.log
        // "Equipment data:", equipmentData;
        // //console.log
        // "Equipment images:", equipmentImages;
        // //console.log
        // "Equipment images length:", equipmentImages.length;
        await update(equipmentId, equipmentData);

        // Handle image updates
        //console.log
        // "Equipment images:", equipmentImages;
        if (equipmentImages.length > 0) {
          await Promise.all(
            equipmentImages.map(async (image, index) => {
              image.equipmentId = equipmentId;
              console.log("image", image);
              //console.log
              if (image.id.length > 0) {
                // New image
                await uploadImage(equipmentId, image.url, index === 0);
              }
            })
          );
        }
      } else {
        // Create new equipment
        const createdEquipment = await create(equipmentData);

        // Upload images for new equipment
        if (equipmentImages.length > 0) {
          await Promise.all(
            equipmentImages.map(async (image, index) => {
              //console.log
              image.equipmentId = createdEquipment.id || "";
              //console.log
              await uploadImage(createdEquipment.id, image.url, index === 0);
            })
          );
        }
      }

      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("equipment.form.errors.saveFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollView}>
        <TextInput
          label={t("equipment.form.name")}
          value={equipment.name}
          onChangeText={(text) => setEquipment({ ...equipment, name: text })}
          style={styles.input}
          textColor={theme.colors.onSurface}
        />
        <TextInput
          label={t("equipment.form.description")}
          value={equipment.description}
          onChangeText={(text) =>
            setEquipment({ ...equipment, description: text })
          }
          style={styles.input}
          multiline
          numberOfLines={4}
          textColor={theme.colors.onSurface}
        />
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {t("equipment.form.category")}
        </Text>
        <View
          style={[
            styles.pickerContainer,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Picker
            selectedValue={selectedCategoryId}
            onValueChange={(value) => {
              setSelectedCategoryId(value);
              const selectedCategory = categories.find((c) => c.id === value);
              if (selectedCategory) {
                setEquipment({ ...equipment, category: selectedCategory });
              }
            }}
            style={[styles.picker, { color: theme.colors.onSurface }]}
          >
            {categories.map((category) => (
              <Picker.Item
                key={category.id}
                label={category.name}
                value={category.id}
                color={theme.colors.onSurface}
              />
            ))}
          </Picker>
        </View>
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {t("equipment.form.location")}
        </Text>
        <View
          style={[
            styles.pickerContainer,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Picker
            selectedValue={selectedLocationId}
            onValueChange={(value) => {
              setSelectedLocationId(value);
              setEquipment({ ...equipment, locationId: value });
            }}
            style={[styles.picker, { color: theme.colors.onSurface }]}
          >
            <Picker.Item
              label="Select a location"
              value=""
              color={theme.colors.onSurface}
            />
            {locations.map((location) => (
              <Picker.Item
                key={location.id}
                label={location.name}
                value={location.id}
                color={theme.colors.onSurface}
              />
            ))}
          </Picker>
        </View>
        <Button
          mode="outlined"
          onPress={handleCreateLocation}
          style={styles.button}
          textColor={theme.colors.primary}
        >
          {t("equipment.form.createLocation")}
        </Button>
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {t("equipment.form.images")}
        </Text>
        <ImageList
          images={imageUrls}
          onAddImage={handleAddImage}
          onRemoveImage={handleRemoveImage}
        />
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          {equipmentId
            ? t("equipment.form.submit.update")
            : t("equipment.form.submit.add")}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  picker: {
    height: 50,
  },
  label: {
    marginLeft: 8,
    marginTop: 8,
    color: "#666",
  },
  button: {
    marginTop: 10,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 20,
  },
});
