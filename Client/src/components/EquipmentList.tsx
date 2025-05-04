import React from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Equipment } from "../types/Equipment";
import { EquipmentCard } from "./EquipmentCard";

interface EquipmentListProps {
  equipment: Equipment[];
  onRefresh: () => Promise<void>;
  onEquipmentPress: (equipment: Equipment) => void;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  equipment,
  onRefresh,
  onEquipmentPress,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={equipment}
        renderItem={({ item }) => (
          <EquipmentCard
            equipment={item}
            onPress={() => onEquipmentPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});
