import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { CreateEquipmentDto } from "../types/Equipment";
import { Location } from "../types/Location";
import { getByOwner } from "../api/locationApi";
import { create } from "../api/equipmentApi";
import { useAuth } from "../context/AuthContext";
import { Picker } from "@react-native-picker/picker";
import LocationFormScreen from "./LocationFormScreen";

type AddEquipmentScreenProps = {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
};

export default function AddEquipmentScreen({
  initialLocation,
}: AddEquipmentScreenProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [equipment, setEquipment] = useState<CreateEquipmentDto>({
    name: "",
    description: "",
    locationId: "",
    condition: "Good",
    isAvailable: true,
  });

  useEffect(() => {
    loadLocations();
  }, []);

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

  const handleCreateLocation = () => {
    setShowLocationForm(true);
  };

  const handleLocationCreated = () => {
    setShowLocationForm(false);
    loadLocations();
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

  const handleSubmit = async () => {
    if (!equipment.name || !equipment.description || !selectedLocationId) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const newEquipment = {
        ...equipment,
        locationId: selectedLocationId,
        ownerId: user?.id || "",
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await create(newEquipment);
      router.back();
    } catch (error) {
      console.error("Failed to create equipment:", error);
      Alert.alert("Error", "Failed to create equipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Equipment</Text>

      <TextInput
        label="Name"
        value={equipment.name}
        onChangeText={(text) => setEquipment({ ...equipment, name: text })}
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={equipment.description}
        onChangeText={(text) =>
          setEquipment({ ...equipment, description: text })
        }
        style={styles.input}
        multiline
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Condition</Text>
        <Picker
          selectedValue={equipment.condition}
          onValueChange={(value: string) =>
            setEquipment({ ...equipment, condition: value })
          }
          style={styles.picker}
        >
          <Picker.Item label="Good" value="Good" />
          <Picker.Item label="Fair" value="Fair" />
          <Picker.Item label="Poor" value="Poor" />
          <Picker.Item label="Needs Repair" value="Needs Repair" />
        </Picker>
      </View>

      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>Location</Text>

        {initialLocation && (
          <Text style={styles.currentLocation}>
            Current Location: {initialLocation.latitude.toFixed(6)},{" "}
            {initialLocation.longitude.toFixed(6)}
          </Text>
        )}

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select Location</Text>
          <Picker
            selectedValue={selectedLocationId}
            onValueChange={(value: string) => setSelectedLocationId(value)}
            style={styles.picker}
          >
            <Picker.Item label="Select a location" value="" />
            {locations.map((location) => (
              <Picker.Item
                key={location.id}
                label={location.name}
                value={location.id}
              />
            ))}
          </Picker>
        </View>

        <Button
          mode="outlined"
          onPress={handleCreateLocation}
          style={styles.createLocationButton}
        >
          Create New Location
        </Button>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={loading}
        disabled={loading}
      >
        Create Equipment
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
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
  locationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  currentLocation: {
    marginBottom: 10,
    color: "#666",
  },
  createLocationButton: {
    marginTop: 10,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 20,
  },
});
