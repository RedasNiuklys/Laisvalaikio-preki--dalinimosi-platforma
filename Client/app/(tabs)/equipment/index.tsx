import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import EquipmentListPage from "@/src/pages/equipment/EquipmentListPage";
import { showToast } from "@/src/components/Toast";
import { useTranslation } from "react-i18next";

export default function EquipmentScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showToast("error", t("location.errors.permissionDenied"));
        }
      } catch (error) {
        console.error("Error checking location permission:", error);
        showToast("error", t("location.errors.permissionCheckFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    checkLocationPermission();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <EquipmentListPage />;
}
