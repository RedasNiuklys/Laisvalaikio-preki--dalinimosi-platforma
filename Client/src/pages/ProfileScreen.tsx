import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  useTheme as usePaperTheme,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../api/users";
import { User } from "../types/User";
import { styles } from "../styles/ProfileScreen.styles";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { getAuthToken } from "../utils/authUtils";
import { BASE_URL } from "../utils/envConfig";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

const ProfileScreen = () => {
  const theme = usePaperTheme();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getProfile(); // Uses current user ID from auth token
      setUser(response);
      //console.log
      "response", response;
      setProfile(response);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUser();
      return () => {};
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("profile.permissions.title"),
          t("profile.permissions.message")
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("common.error"), t("profile.image.pickError"));
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(t("common.error"), t("profile.image.takeError"));
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);

      // Resize and compress image
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 500, height: 500 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append("userId", String(user?.id || 0));

      if (Platform.OS === "web") {
        // For web, convert to File object
        const response = await fetch(manipulatedImage.uri);
        const blob = await response.blob();
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        formData.append("file", file);
      } else {
        // For mobile (Expo), save to temporary file and send
        const tempFileUri = `${
          FileSystem.cacheDirectory
        }avatar_${Date.now()}.jpg`;
        await FileSystem.copyAsync({
          from: manipulatedImage.uri,
          to: tempFileUri,
        });

        // Create a file object from the temporary file
        const fileInfo = await FileSystem.getInfoAsync(tempFileUri);
        if (!fileInfo.exists) {
          throw new Error("Failed to create temporary file");
        }

        const file = {
          uri: tempFileUri,
          type: "image/jpeg",
          name: "avatar.jpg",
        };

        formData.append("file", file as any);
      }

      // Upload using axios
      const token = await getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/Storage/UploadAvatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Clean up temporary file on mobile
      if (Platform.OS !== "web") {
        const tempFileUri = `${
          FileSystem.cacheDirectory
        }avatar_${Date.now()}.jpg`;
        await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
      }

      // Update profile with new avatar URL
      setProfile((prev) =>
        prev ? { ...prev, avatarUrl: response.data.avatarUrl } : null
      );
      Alert.alert(t("common.success"), t("profile.image.uploadSuccess"));
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(t("common.error"), t("profile.image.uploadError"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }
  if (error) {
    return <Text style={{ color: theme.colors.error }}>{error}</Text>;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={{ color: theme.colors.onBackground }}
      >
        {t("profile.title")}
      </Text>

      {profile ? (
        <>
          <View style={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile.name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.buttonText}>{t("profile.image.choose")}</Text>
            </TouchableOpacity>

            {Platform.OS !== "web" && (
              <TouchableOpacity style={styles.button} onPress={takePhoto}>
                <Text style={styles.buttonText}>{t("profile.image.take")}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.text, { color: theme.colors.onBackground }]}>
            {t("profile.name")}: {profile.name}
          </Text>
          <Text style={[styles.text, { color: theme.colors.onBackground }]}>
            {t("profile.email")}: {profile.email}
          </Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t("profile.logout")}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={{ color: theme.colors.error }}>{t("profile.noData")}</Text>
      )}
    </View>
  );
};

export default ProfileScreen;
