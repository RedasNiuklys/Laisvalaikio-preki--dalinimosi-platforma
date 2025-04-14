import { Stack, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, View,Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import LoginScreen from "@/src/pages/LoginScreen";
import RegisterScreen from "@/src/pages/RegisterScreen";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';

import * as Router from 'expo-router';


export default function TabLayout() {
  const Stack = createNativeStackNavigator();

  const { theme } = useTheme(); // Get the theme from context
  const { isAuthenticated } = useAuth(); // Get auth status from context
  // const isAuthenticated = false;
  if (!isAuthenticated) {
    // You can return a login/register flow if the user is not authenticated
    return (
      <NavigationIndependentTree>

      <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
      </NavigationContainer>
      </NavigationIndependentTree>
    );
  }
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: theme.backgroundColor },
        tabBarActiveTintColor: theme.ctaButtonColor,
        tabBarInactiveTintColor: theme.primaryTextColor,
        headerStyle: { backgroundColor: theme.backgroundColor },
        headerTintColor: theme.primaryTextColor,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "index") iconName = "home";
          else if (route.name === "profile") iconName = "person";
          else if (route.name === "settings") iconName = "settings";
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    />
  );
}
