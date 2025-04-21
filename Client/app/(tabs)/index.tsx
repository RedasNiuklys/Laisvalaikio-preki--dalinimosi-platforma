import { View, Text, Button } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import LoginScreen from "@/src/pages/LoginScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthToken } from "@/src/utils/authUtils";
import { useEffect, useCallback } from "react";
import DateSelector from "@/src/components/DateSelector";
import { useNavigation } from "@react-navigation/native";
export default function HomeScreen() {
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      const checkToken = async () => {
        let storedToken = await getAuthToken();
        if (!storedToken) {
          navigation.navigate("Login");
        }
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
        <DateSelector equipmentId="1" onDateSelect={() => {}} />
      </View>
    );
  }
}
