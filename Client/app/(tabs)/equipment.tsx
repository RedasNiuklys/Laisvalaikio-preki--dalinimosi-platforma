import { StyleSheet, View } from "react-native";
import { EquipmentList } from "../../src/components/EquipmentList";
import { getByOwner } from "../../src/api/equipmentApi";
import { Equipment } from "../../src/types/Equipment";
import { useState, useEffect } from "react";
import { useAuth } from "../../src/context/AuthContext";
import React from "react";
import { FAB } from "react-native-paper";
import { router } from "expo-router";

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const { user } = useAuth();

  const loadEquipment = async () => {
    try {
      if (user?.id) {
        const data = await getByOwner(user.id);
        setEquipment(data);
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, [user]);

  const handleEquipmentPress = (equipment: Equipment) => {
    router.push({
      pathname: "/equipment/[id]",
      params: { id: equipment.id },
    });
  };

  return (
    <View style={styles.container}>
      <EquipmentList
        equipment={equipment}
        onRefresh={loadEquipment}
        onEquipmentPress={handleEquipmentPress}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push("/(modals)/equipment/add-equipment")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
