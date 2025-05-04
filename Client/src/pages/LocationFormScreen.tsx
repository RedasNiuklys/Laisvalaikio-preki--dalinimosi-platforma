import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Location, LocationFormData } from "../types/Location";
import { createLocation, updateLocation } from "../api/locationApi";
import { showToast } from "../components/Toast";
import LocationPicker from "../components/LocationPicker";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
type LocationFormScreenParams = {
  location?: Location;
  isEditing?: boolean;
  onSubmitSuccess?: () => void;
  initialCoordinates?: {
    latitude: number;
    longitude: number;
  };
};

const LocationFormScreen = (
  locationformscreenparams: LocationFormScreenParams
) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const route = useRoute();
  const { t } = useTranslation();
  const {
    location: existingLocation,
    isEditing,
    onSubmitSuccess,
    initialCoordinates,
  } = (route.params as LocationFormScreenParams) || {};

  const [formData, setFormData] = useState<Partial<Location>>({
    userId: user?.id,
    name: "",
    description: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: undefined,
    longitude: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingLocation) {
      setFormData(existingLocation);
    } else if (initialCoordinates) {
      setFormData((prev) => ({
        ...prev,
        userId: user?.id,
        latitude: initialCoordinates.latitude,
        longitude: initialCoordinates.longitude,
      }));
      console.log(formData);
    } else {
      setFormData((prev) => ({
        ...prev,
        userId: user?.id,
      }));
      console.log(formData);
    }
  }, [existingLocation, initialCoordinates]);

  const handleChange = (field: keyof LocationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    console.log(formData);
  };

  const handleLocationSelected = (locationData: {
    latitude: number;
    longitude: number;
    streetAddress: string;
    city: string;
    state: string;
    country: string;
  }) => {
    console.log(locationData);
    setFormData((prev) => ({
      ...prev,
      ...locationData,
      userId: user?.id,
    }));
    console.log(formData);
  };

  const validateForm = (): boolean => {
    if (!formData.name) {
      setError(t("location.errors.nameRequired"));
      showToast("error", t("location.errors.nameRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && existingLocation?.id) {
        await updateLocation(existingLocation.id, formData as Location);
        showToast("success", t("location.form.success.updated"));
      } else {
        await createLocation(formData as Location);
        showToast("success", t("location.form.success.created"));
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      setError(t("location.form.error.save"));
      showToast("error", t("location.form.error.save"));
      console.error("Error saving location:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text variant="headlineMedium" style={styles.title}>
            {isEditing ? t("location.form.edit") : t("location.form.addNew")}
          </Text>

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <TextInput
            label={t("location.form.name")}
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t("location.form.description")}
            value={formData.description}
            onChangeText={(text) => handleChange("description", text)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.mapContainer}>
            <LocationPicker
              initialLocation={
                formData.latitude && formData.longitude
                  ? {
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                    }
                  : undefined
              }
              onLocationSelected={handleLocationSelected}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            {isEditing ? t("location.form.edit") : t("location.form.addNew")}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 16,
  },
  mapContainer: {
    height: 400,
    marginBottom: 16,
  },
  errorText: {
    marginBottom: 16,
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default LocationFormScreen;
