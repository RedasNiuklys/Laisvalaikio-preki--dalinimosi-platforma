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
import {
  create,
  uploadImage,
  getById,
  update,
  deleteImage as deleteEquipmentImage,
} from "../api/equipmentApi";
import { getCategories } from "../api/categoryApi";
import { useAuth } from "../context/AuthContext";
import { Picker } from "@react-native-picker/picker";
import LocationFormScreen from "./LocationFormScreen";
import { ImageList } from "../components/ImageList";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
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
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [equipmentImages, setEquipmentImages] = useState<EquipmentImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<UpdateEquipmentDto>({
    name: "",
    description: "",
    locationId: "",
    condition: "Good",
    categoryId: 1,
    IsAvailable: true,
  });

  // Load categories first
  useEffect(() => {
    loadCategories();
  }, []);

  // Load locations
  useEffect(() => {
    loadLocations();
  }, [user?.id]);

  // Set default location when locations are loaded (for new equipment)
  useEffect(() => {
    if (!equipmentId && locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id || "");
    }
  }, [locations, equipmentId, selectedLocationId]);

  // Load equipment after categories and locations are available
  useEffect(() => {
    if (equipmentId && categories.length > 0 && locations.length > 0) {
      loadEquipment();
    }
  }, [equipmentId, categories, locations]);

  const loadEquipment = async () => {
    try {
      const data = await getById(equipmentId!);
      console.log("Loaded equipment data:", data);
      console.log("Equipment locationId from API:", data.location.id);
      console.log("Available locations:", locations.map(l => ({ id: l.id, name: l.name })));
      console.log("Equipment images:", data.images);
      console.log("Image URLs:", data.images?.map((img) => ({ imageUrl: img.imageUrl, url: img.url })));
      
      setEquipment({
        name: data.name,
        description: data.description,
        locationId: data.location.id,
        condition: data.condition,
        categoryId: data.category.id,
        IsAvailable: data.IsAvailable,
      });
      
      // Verify location exists in the locations array before setting it
      const locationExists = locations.find(loc => loc.id === data.location.id);
      if (locationExists) {
        console.log("Setting selectedLocationId to:", data.location.id);
        setSelectedLocationId(data.location.id);
      } else {
        console.warn("Location not found in locations array:", data.location.id);
        // If location doesn't exist, try to find it
        if (locations.length > 0) {
          setSelectedLocationId(locations[0].id);
        }
      }
      
      // Use the category ID directly, not the index
      setSelectedCategoryId(data.category.id);
      if (data.images) {
        const normalizedImages = data.images.map((img) => ({
          ...img,
          url: img.url || img.imageUrl || "",
        }));
        setRemovedImageIds([]);
        setEquipmentImages(normalizedImages);
        const urls = normalizedImages.map((img) => img.url).filter(Boolean) as string[];
        console.log("Setting image URLs:", urls);
        setImageUrls(urls);
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
        setSelectedLocationId(equipment.locationId || data[0].id || "");

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
        setSelectedCategoryId(equipment.categoryId || data[0].id);
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
          result.assets.map(async (asset, index) => {
            const manipulatedImage = await ImageManipulator.manipulate(asset.uri);
            manipulatedImage.resize({ width: 500, height: 500 });

            const imageRef = await manipulatedImage.renderAsync();
            const imageResult = await imageRef.saveAsync({
              compress: 0.7,
              format: SaveFormat.JPEG,
              base64: false,
            });

            let imageUrl = imageResult.uri;
            if (Platform.OS !== "web") {
              const fileName = `equipment_${Date.now()}_${index}.jpg`;
              const filePath = `${FileSystem.Paths.cache.uri}${fileName}`;

              await FileSystem.copyAsync({
                from: imageResult.uri,
                to: filePath,
              });

              const fileInfo = await FileSystem.getInfoAsync(filePath);
              if (!fileInfo.exists) {
                throw new Error("Failed to create temporary image file");
              }

              imageUrl = filePath;
            }

            const newImage: EquipmentImage = {
              id: "", // This will be set by the server
              equipmentId: "", // This will be set when equipment is created
              url: imageUrl,
              isMain: equipmentImages.length === 0 && index === 0,
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
      const imagePath = imageToRemove?.url || imageToRemove?.imageUrl || "";

      if (imageToRemove?.id) {
        setRemovedImageIds((prev) =>
          prev.includes(imageToRemove.id) ? prev : [...prev, imageToRemove.id]
        );
      }

      // Only handle file system operations on native platforms
      if (
        Platform.OS !== "web" &&
        imagePath.startsWith(FileSystem.Paths.cache.uri)
      ) {
        await FileSystem.deleteAsync(imagePath, {
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
    console.log("handleSubmit called");
    console.log("Current state:", {
      selectedLocationId,
      selectedCategoryId,
      equipmentName: equipment.name,
      equipmentDescription: equipment.description,
      equipmentLocationId: equipment.locationId
    });
    
    if (
      !equipment.name ||
      !equipment.description ||
      !selectedLocationId ||
      !user?.id ||
      !selectedCategoryId
    ) {
      console.log("Validation failed - missing required fields");
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
        categoryId: selectedCategory.id,
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

        // Persist removed server images.
        if (removedImageIds.length > 0) {
          await Promise.all(
            removedImageIds.map((imageId) =>
              deleteEquipmentImage(equipmentId, imageId)
            )
          );
        }

        // Handle new image uploads only (existing images already live on server)
        const newImages = equipmentImages.filter((image) => !image.id);
        if (newImages.length > 0) {
          const existingImagesCount = equipmentImages.length - newImages.length;

          await Promise.all(
            newImages.map(async (image, index) => {
              console.log("image", image);
              const imageUri = image.url || image.imageUrl;
              if (!imageUri) return;

              await uploadImage(
                equipmentId,
                imageUri,
                existingImagesCount === 0 && index === 0
              );
            })
          );
        }

        setRemovedImageIds([]);
      } else {
        // Create new equipment
        const createdEquipment = await create(equipmentData);

        // Upload images for new equipment
        if (equipmentImages.length > 0) {
          await Promise.all(
            equipmentImages.map(async (image, index) => {
              //console.log
              image.equipmentId = createdEquipment.id || "";
              const imageUri = image.url || image.imageUrl;
              if (!imageUri) return;
              //console.log
              await uploadImage(createdEquipment.id, imageUri, index === 0);
            })
          );
        }
      }

      try {
        if (router.canGoBack()) {
          router.push(`/equipment/${equipmentId || ""}`);
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.warn('Navigation error:', error);
        router.replace('/');
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: `${error}  ${t("equipment.form.errors.saveFailed")}`,
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
                console.log("Selected category:", selectedCategory);
                console.log("Updating equipment with categoryId:", selectedCategory.id);
                setEquipment({ ...equipment, categoryId: selectedCategory.id });
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
              console.log("Location picker changed to:", value);
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
