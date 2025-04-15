import { Stack, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, View, Text } from "react-native";
import { useTheme as useAppTheme } from "@/src/context/ThemeContext";
import { useTheme as usePaperTheme } from "react-native-paper";
import { useAuth } from "@/src/context/AuthContext";
import LoginScreen from "@/src/pages/LoginScreen";
import RegisterScreen from "@/src/pages/RegisterScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";

export default function TabLayout() {
  const Stack = createNativeStackNavigator();

  const { theme: appTheme } = useAppTheme(); // Get the theme from context
  const theme = usePaperTheme(); // Get the Paper theme
  const { isAuthenticated } = useAuth(); // Get auth status from context
  console.log(isAuthenticated);
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
  } else {
    return (
      <Tabs
        screenOptions={({ route }) => ({
          tabBarStyle: { backgroundColor: theme.colors.background },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onBackground,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.onBackground,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "index") iconName = "home";
            else if (route.name === "profile") iconName = "person";
            else if (route.name === "settings") iconName = "settings";
            return (
              <Ionicons name={iconName as any} size={size} color={color} />
            );
          },
        })}
      />
    );
  }
}
