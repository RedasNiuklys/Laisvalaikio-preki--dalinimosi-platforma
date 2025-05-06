// import React, { useState } from "react";
// import { View, StyleSheet, ScrollView } from "react-native";
// import {
//   Text,
//   TextInput,
//   Button,
//   useTheme,
//   ActivityIndicator,
//   SegmentedButtons,
// } from "react-native-paper";
// import { useNavigation, Stack } from "expo-router";
// import { useTranslation } from "react-i18next";
// import {
//   Equipment,
//   EquipmentCondition,
//   CreateEquipmentDto,
// } from "@/src/types/Equipment";
// import { showToast } from "@/src/components/Toast";
// import { useAuth } from "@/src/context/AuthContext";
// import * as equipmentApi from "@/src/api/equipmentApi";

// export default function NewEquipmentScreen() {
//   const [saving, setSaving] = useState(false);
//   const [formData, setFormData] = useState<CreateEquipmentDto>({
//     name: "",
//     description: "",
//     category: "",
//     condition: "Good",
//     isAvailable: true,
//     locationId: "",
//     images: [],
//   });
//   const navigation = useNavigation();
//   const theme = useTheme();
//   const { t } = useTranslation();
//   const { user } = useAuth();

//   const handleSave = async () => {
//     try {
//       setSaving(true);
//       const newEquipment = await equipmentApi.create(formData);
//       showToast("success", t("equipment.messages.createSuccess"));
//       navigation.goBack();
//     } catch (error) {
//       console.error("Error creating equipment:", error);
//       showToast("error", t("equipment.errors.createFailed"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <>
//       <Stack.Screen
//         options={{
//           title: t("equipment.new.title"),
//           headerShown: true,
//         }}
//       />
//       <ScrollView
//         style={[styles.container, { backgroundColor: theme.colors.background }]}
//       >
//         <View style={styles.form}>
//           <TextInput
//             label={t("equipment.form.name")}
//             value={formData.name}
//             onChangeText={(text) => setFormData({ ...formData, name: text })}
//             style={styles.input}
//           />

//           <TextInput
//             label={t("equipment.form.description")}
//             value={formData.description}
//             onChangeText={(text) =>
//               setFormData({ ...formData, description: text })
//             }
//             multiline
//             numberOfLines={4}
//             style={styles.input}
//           />

//           <TextInput
//             label={t("equipment.form.category")}
//             value={formData.category}
//             onChangeText={(text) =>
//               setFormData({ ...formData, category: text })
//             }
//             style={styles.input}
//           />

//           <Text variant="bodyMedium" style={styles.label}>
//             {t("equipment.form.condition")}
//           </Text>
//           <SegmentedButtons
//             value={formData.condition}
//             onValueChange={(value) =>
//               setFormData({ ...formData, condition: value })
//             }
//             buttons={[
//               { value: "Good", label: t("equipment.condition.good") },
//               { value: "Fair", label: t("equipment.condition.fair") },
//               { value: "Poor", label: t("equipment.condition.poor") },
//               {
//                 value: "Needs Repair",
//                 label: t("equipment.condition.needsRepair"),
//               },
//             ]}
//             style={styles.segmentedButtons}
//           />

//           <Button
//             mode="contained"
//             onPress={handleSave}
//             loading={saving}
//             disabled={saving}
//             style={styles.saveButton}
//           >
//             {t("common.buttons.save")}
//           </Button>
//         </View>
//       </ScrollView>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   form: {
//     gap: 16,
//   },
//   input: {
//     marginBottom: 8,
//   },
//   label: {
//     marginBottom: 8,
//   },
//   segmentedButtons: {
//     marginBottom: 16,
//   },
//   saveButton: {
//     marginTop: 16,
//   },
// });
