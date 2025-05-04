// import { View, StyleSheet } from "react-native";
// import { Text } from "react-native-paper";
// import { useLocalSearchParams } from "expo-router";
// import { getById } from "../../src/api/equipmentApi";
// import { Equipment } from "../../src/types/Equipment";
// import { useState, useEffect } from "react";

// export default function EquipmentDetailsScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const [equipment, setEquipment] = useState<Equipment | null>(null);

//   useEffect(() => {
//     const loadEquipment = async () => {
//       try {
//         const data = await getById(id);
//         setEquipment(data);
//       } catch (error) {
//         console.error("Failed to load equipment:", error);
//       }
//     };

//     loadEquipment();
//   }, [id]);

//   if (!equipment) {
//     return (
//       <View style={styles.container}>
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text variant="headlineMedium">{equipment.name}</Text>
//       <Text variant="bodyLarge">{equipment.description}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
// });
