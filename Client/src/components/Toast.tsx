import Toast from "react-native-toast-message";
import { useTheme } from "react-native-paper";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "@/src/styles/globalStyles";

type ToastType = "success" | "error" | "info";

// Define the correct type for the toast config
const toastConfig = {
  success: (props: any) => {
    const theme = useTheme();
    return (
      <View
        style={[styles.container, { backgroundColor: colors.success }]}
      >
        <Text style={styles.text}>{props.text1}</Text>
      </View>
    );
  },
  error: (props: any) => {
    const theme = useTheme();
    return (
      <View style={[styles.container, { backgroundColor: colors.danger }]}>
        <Text style={styles.text}>{props.text1}</Text>
      </View>
    );
  },
  info: (props: any) => {
    const theme = useTheme();
    return (
      <View
        style={[styles.container, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.text}>{props.text1}</Text>
      </View>
    );
  },
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: "100%",
    padding: spacing.md,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export const showToast = (type: ToastType, message: string) => {
  Toast.show({
    type,
    text1: message,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
  });
};

export const ToastContainer = () => {
  return <Toast config={toastConfig} />;
};
