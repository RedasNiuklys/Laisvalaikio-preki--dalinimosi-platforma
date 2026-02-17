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
import { getProfile } from "../api/userApi";
import { User } from "../types/User";
import { styles } from "../styles/ProfileScreen.styles";
import * as ImagePicker from "expo-image-picker";
import { MediaType, CameraType } from "expo-image-picker";
import {SaveOptions, ImageResult , SaveFormat, ImageManipulator, ImageManipulatorContext, ImageRef } from "expo-image-manipulator";
import { getAuthToken } from "../utils/authUtils";
import { BASE_URL } from "../utils/envConfig";
import axios from "axios";
import {File as ExpoFile, Directory, Paths, FileInfo} from "expo-file-system";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
  email: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getProfile(); // Uses current user ID from auth token
      setUser(response);

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
      return () => { };
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
        mediaTypes: 'images' as MediaType,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("common.status.error"), t("profile.image.pickError"));
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: CameraType.back,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(t("common.status.error"), t("profile.image.takeError"));
    }
  };

  const uploadImage = async (uri: string) => {
    let tempFileUri: string | null = null;
    let manipulatedImage: ImageManipulatorContext | null = null;
    let imageRef : ImageRef | null = null;
    let ImageResult : ImageResult | null = null;
    // Android specific vars
    let androidFile: ExpoFile | null = null;
    let info: FileInfo;  

    try {
      setAvatarLoading(true);
      console.log("Starting image processing...");

      // Step 1: Manipulate image (resize and compress)
      manipulatedImage = await ImageManipulator.manipulate(uri);
      // const manipulatedImage = await manipulate(
      //   uri,
      //   [{ resize: { width: 500, height: 500 } }],
      //   { compress: 0.7, format: SaveFormat.JPEG }
      // );
      manipulatedImage.resize({ width: 500, height: 500 });
    
      // Extract ImageRef for saving/uploading
      imageRef = await manipulatedImage.renderAsync();
      ImageResult = await imageRef.saveAsync({
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: false,
      } as SaveOptions);
      // Step 2: Prepare file for upload
      const formData = new FormData();
      formData.append("userId", String(user?.id || 0));
      androidFile = new ExpoFile(ImageResult.uri);
      if (Platform.OS === "web") {
        // For web: convert blob to File object
        console.log("Web platform detected - converting to File object");
        const response = await fetch(ImageResult.uri);
        console.log("Fetched image from URI, status:", ImageResult.uri);
        const blob = await response.blob();
        console.log("Blob created, size:", blob, "bytes");
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        formData.append("file", file);
      } else {
        // For mobile: create temp file in cache directory
        console.log("Mobile platform detected - creating temporary file");
        console.log("Manipulated image URI:", ImageResult.uri);
        tempFileUri = `${Paths.cache.name}avatar_${Date.now()}.jpg`;
        
        // Copy manipulated image to temporary location
        androidFile.move(Paths.cache);
        console.log("Temporary file created:", androidFile.uri);

        // Verify temp file exists
        if(!androidFile.exists){
            throw new Error("Failed to create temporary file");
        }
        info = androidFile.info();
        console.log("Temporary file path,", info.uri);
        console.log("Temporary file verified, size:", info.size, "bytes");

        // Append file to form data
        const file = {
          uri: info.uri,
          type: "image/jpeg",
          name: "avatar.jpg",
        };
        formData.append("file", file as any);
      }

      // Step 3: Upload to server
      console.log("Uploading image to server...");
      const token = await getAuthToken();
      const uploadResponse = await axios.post(
        `${BASE_URL}/Storage/UploadAvatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Upload successful, new avatar URL:", uploadResponse.data.avatarUrl);

      // Step 4: Update UI with new avatar (only update avatar, not entire profile)
      setAvatarUrl(uploadResponse.data.avatarUrl);

      Alert.alert(t("common.Status.success"), t("profile.image.uploadSuccess"));
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(t("common.Status.error"), t("profile.image.uploadError"));
    } finally {
      // Step 5: Clean up temporary file
      if (Platform.OS !== "web" && androidFile?.uri) {
        try {
          if (androidFile != null) {
          console.log("Cleaning up temporary file:", androidFile.uri);
          const fileInfo = await androidFile.info();
          if (fileInfo.exists) {
            await androidFile.delete();
            console.log("Temporary file deleted successfully");
          }
        }
        } catch (cleanupError) {
          console.warn("Warning: Failed to delete temporary file:", cleanupError);
        }
      }
      setAvatarLoading(false);
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
            {avatarUrl || profile.avatarUrl ? (
              <Image
                source={{ uri: avatarUrl || profile.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile.firstName?.charAt(0)?.toUpperCase() || "?"}
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
            {t("profile.name")}: {profile.firstName} {profile.lastName}
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
