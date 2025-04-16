import { View, Text, Button } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import LoginScreen from "@/src/pages/LoginScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthToken } from "@/src/utils/authUtils";
import { useEffect, useCallback } from "react";
import DateSelector from "@/src/components/DateSelector";
export default function HomeScreen() {
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      const checkToken = async () => {
        let storedToken = await getAuthToken();
      };
      checkToken();
    }, [])
  );
  const { isAuthenticated, token } = useAuth();
  if (!isAuthenticated) {
    return <LoginScreen />;
  } else {
    return (
      <View>
        <Text>"Programming is FuN </Text>
        <DateSelector equipmentId="1" onDateSelect={() => {}} />
      </View>
    );
  }
}
