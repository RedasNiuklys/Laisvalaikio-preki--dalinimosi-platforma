import { useCallback } from "react";
import { BackHandler, Alert, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import EquipmentListPage from "@/src/pages/equipment/EquipmentListPage";

export default function HomeScreen() {
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }

      const onBackPress = () => {
        Alert.alert(
          t("common.exit.title", { defaultValue: "Close app?" }),
          t("common.exit.message", {
            defaultValue: "Do you want to close the app?",
          }),
          [
            {
              text: t("common.cancel", { defaultValue: "Cancel" }),
              style: "cancel",
            },
            {
              text: t("common.exit.action", { defaultValue: "Close" }),
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );

        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [t])
  );

  return <EquipmentListPage ownerOnly pageTitle={t("navigation.myEquipment", { defaultValue: "My equipments" })} />;
}
