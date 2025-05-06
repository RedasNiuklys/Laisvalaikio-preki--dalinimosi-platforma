import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import {
  CreateEquipmentDto,
  Equipment,
  EquipmentImage,
} from "../types/Equipment";
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
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [equipmentImages, setEquipmentImages] = useState<EquipmentImage[]>([]);
  const [equipment, setEquipment] = useState<CreateEquipmentDto>({
    name: "",
    description: "",
    locationId: "",
    condition: "Good",
    isAvailable: true,
    category: "",
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
        isAvailable: data.isAvailable,
        category: data.category,
      });
      setSelectedLocationId(data.locationId);
      setSelectedCategoryId(
        categories.findIndex((c) => c.name === data.category) + 1
      );
      if (data.images) {
        setEquipmentImages(data.images);
        setImageUrls(data.images.map((img) => img.imageUrl));
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load equipment",
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
          text1: "Permission needed",
          text2: "Please grant permission to access your photos",
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
              id: 1, // This will be set by the server
              equipmentId: "", // This will be set when equipment is created
              imageUrl: imageUrl,
              isMainImage: equipmentImages.length === 0, // First image is main by default
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            return newImage;
          })
        );

        setEquipmentImages([...equipmentImages, ...newImages]);
        setImageUrls([...imageUrls, ...newImages.map((img) => img.imageUrl)]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick image",
      });
    }
  };

  const handleRemoveImage = async (index: number) => {
    try {
      const imageToRemove = equipmentImages[index];

      // Only handle file system operations on native platforms
      if (
        Platform.OS !== "web" &&
        imageToRemove.imageUrl.startsWith(FileSystem.cacheDirectory || "")
      ) {
        await FileSystem.deleteAsync(imageToRemove.imageUrl, {
          idempotent: true,
        });
      }

      setEquipmentImages(equipmentImages.filter((_, i) => i !== index));
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove image",
      });
    }
  };

  const handleSubmit = async () => {
    if (
      !equipment.name ||
      !equipment.description ||
      !selectedLocationId ||
      !user?.id ||
      !selectedCategoryId
    ) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories[selectedCategoryId - 1];
      if (!selectedCategory) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please select a valid category",
        });
        return;
      }
      console.log("Test");
      const equipmentData: CreateEquipmentDto = {
        name: equipment.name,
        description: equipment.description,
        locationId: selectedLocationId,
        category: selectedCategory.name,
        condition: equipment.condition,
        isAvailable: equipment.isAvailable,
      };

      console.log("Equipment data:", equipmentId);
      if (equipmentId) {
        // Update existing equipment
        console.log("Updating equipment:", equipmentId);
        console.log("Equipment data:", equipmentData);
        console.log("Equipment images:", equipmentImages);
        console.log("Equipment images length:", equipmentImages.length);
        await update(equipmentId, equipmentData);

        // Handle image updates
        console.log("Equipment images:", equipmentImages);
        if (equipmentImages.length > 0) {
          await Promise.all(
            equipmentImages.map(async (image, index) => {
              image.equipmentId = equipmentId;
              console.log("Image:", image);
              if (!image.id) {
                // New image
                console.log("Uploading image:", image.imageUrl);
                await uploadImage(equipmentId, image.imageUrl, index === 0);
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
              console.log("Uploading image:", image.imageUrl);
              image.equipmentId = createdEquipment.id || "";
              console.log("Image:", image);
              await uploadImage(
                createdEquipment.id,
                image.imageUrl,
                index === 0
              );
            })
          );
        }
      }

      router.back();
    } catch (error) {
      console.error("Failed to save equipment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save equipment",
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
          label="Name"
          value={equipment.name}
          onChangeText={(text) => setEquipment({ ...equipment, name: text })}
          style={styles.input}
          textColor={theme.colors.onSurface}
        />
        <TextInput
          label="Description"
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
          Category
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
                setEquipment({ ...equipment, category: selectedCategory.name });
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
          Location
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
          Create New Location
        </Button>
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          Images
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
          {equipmentId ? "Update Equipment" : "Add Equipment"}
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
