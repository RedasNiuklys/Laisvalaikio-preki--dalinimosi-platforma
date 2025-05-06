import React from "react";
import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Appbar } from "react-native-paper";
import AddEquipmentScreen from "../../../../src/pages/AddEquipmentScreen";

export default function EditEquipmentModal() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Equipment" />
      </Appbar.Header>
      <AddEquipmentScreen equipmentId={id} />
    </View>
  );
}
