import React from "react";
import { View } from "react-native";
import { Appbar } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import EquipmentDetailsPage from "@/src/pages/equipment/EquipmentDetailsPage";
export default function EquipmentDetailsScreen() {
  const { id, open, bookingId } = useLocalSearchParams<{
  id: string;
  open?: string;
  bookingId?: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();

  return (
  <View style={{ flex: 1 }}>
    <Appbar.Header>
    <Appbar.BackAction
      onPress={() => {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace("/(tabs)/equipment");
      }}
    />
    <Appbar.Content title={t("equipment.details.title")} />
    </Appbar.Header>
    <EquipmentDetailsPage
    id={id}
    openBookingsListOnLoad={open === "bookings"}
    initialBookingId={bookingId}
    />
  </View>
  );
}
