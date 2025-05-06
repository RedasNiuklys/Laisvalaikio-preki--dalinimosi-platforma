import React from "react";
import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Appbar } from "react-native-paper";
import EquipmentDetailsScreen from "../../..//src/pages/EquipmentDetailsScreen";
export default function EquipmentDetailsModal() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Equipment Details" />
      </Appbar.Header>
      <EquipmentDetailsScreen equipmentId={id} />
    </View>
  );
}
