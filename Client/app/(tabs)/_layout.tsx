import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import "@/src/i18n";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
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

  // Don't conditionally render different components - it breaks hook ordering
  // Authentication routing should be handled at root layout level
  return (
    <Tabs
        screenOptions={{
          headerShown: false,
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
