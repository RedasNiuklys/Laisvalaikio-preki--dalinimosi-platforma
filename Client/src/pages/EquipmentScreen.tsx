import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, useTheme, FAB } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { getByOwner } from "../api/equipmentApi";
import { Equipment } from "../types/Equipment";
import { useNavigation } from "@react-navigation/native";

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation();

  const loadEquipment = async () => {
    try {
      if (user?.id) {
        const data = await getByOwner(user.id);
        setEquipment(data);
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, [user]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {equipment.map((item) => (
          <Card key={item.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodyMedium">{item.description}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddEquipment")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
