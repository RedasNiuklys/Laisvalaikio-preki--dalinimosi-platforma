import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Equipment } from "../types/Equipment";
import { MaterialIcons } from "@expo/vector-icons";

interface EquipmentCardProps {
  equipment: Equipment;
  onPress: () => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {equipment.images && equipment.images.length > 0 && (
        <Image
          source={{ uri: equipment.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{equipment.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {equipment.description}
        </Text>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.status,
              equipment.isAvailable ? styles.available : styles.unavailable,
            ]}
          >
            {equipment.isAvailable ? "Available" : "Unavailable"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  available: {
    backgroundColor: "#e6f7e6",
    color: "#2e7d32",
  },
  unavailable: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
});
