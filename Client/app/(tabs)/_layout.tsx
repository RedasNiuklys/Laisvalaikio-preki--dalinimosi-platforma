import { Stack, Tabs } from "expo-router";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Button, View, Text, Settings } from "react-native";
import { useTheme } from "react-native-paper";
import { useAuth } from "@/src/context/AuthContext";
import LoginScreen from "@/src/pages/LoginScreen";
import RegisterScreen from "@/src/pages/RegisterScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/src/context/SettingsContext";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabLayout() {
  const Stack = createNativeStackNavigator();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check for unread messages every second
    const interval = setInterval(async () => {
      if (typeof window !== "undefined") {
        const count = parseInt(
          (await AsyncStorage.getItem("unreadMessageCount")) || "0",
          10
        );
        setUnreadCount(count);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
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
        key={settings.language}
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onBackground,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("navigation.home"),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="equipment/index"
          options={{
            title: t("navigation.equipment"),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cube" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("navigation.profile"),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: t("navigation.messages"),
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chat" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: t("navigation.admin"),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="shield-check"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("navigation.settings"),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }
}
