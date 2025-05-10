import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as MediaLibrary from "expo-media-library";
import EquipmentDetailsPage from "@/src/pages/equipment/EquipmentDetailsPage";
import { showToast } from "@/src/components/Toast";
import { useTranslation } from "react-i18next";

export default function EquipmentDetailsScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const checkGalleryPermission = async () => {
            try {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== "granted") {
                    showToast("error", t("gallery.errors.permissionDenied"));
                }
            } catch (error) {
                console.error("Error checking gallery permission:", error);
                showToast("error", t("gallery.errors.permissionCheckFailed"));
            } finally {
                setIsLoading(false);
            }
        };

        checkGalleryPermission();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <EquipmentDetailsPage />;
} 