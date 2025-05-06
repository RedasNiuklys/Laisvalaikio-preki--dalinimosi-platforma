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
        screenOptions={({ route }) => ({
          tabBarStyle: { backgroundColor: theme.colors.background },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.onBackground,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "index") iconName = "home";
            else if (route.name === "profile") iconName = "account";
            else if (route.name === "settings") iconName = "wrench-outline";
            else if (route.name === "locations")
              iconName = "map-marker-outline";
            else if (route.name === "chat") iconName = "chat-outline";
            else if (route.name === "equipment") iconName = "tools";
            else if (route.name === "admin" && user?.roles?.includes("Admin"))
              iconName = "shield-account";
            return (
              <MaterialCommunityIcons
                name={iconName as any}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("navigation.home"),
          }}
        />
        <Tabs.Screen
          name="locations"
          options={{
            title: t("navigation.locations"),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("navigation.profile"),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: t("navigation.messages"),
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tabs.Screen
          name="equipment"
          options={{
            title: t("navigation.equipment"),
          }}
        />
        {user?.roles?.includes("Admin") && (
          <Tabs.Screen
            name="admin"
            options={{
              title: t("navigation.admin"),
            }}
          />
        )}
        <Tabs.Screen
          name="settings"
          options={{
            title: t("navigation.settings"),
          }}
        />
      </Tabs>
    );
  }
}
