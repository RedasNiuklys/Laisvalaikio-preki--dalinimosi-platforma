import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, useTheme, FAB } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { getUsedDatesForUser } from "../api/usedDatesApi";
import { UsedDates } from "../types/UsedDates";
import { format } from "date-fns";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [usedDates, setUsedDates] = useState<UsedDates[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const loadUsedDates = async () => {
    try {
      if (user?.id) {
        const data = await getUsedDatesForUser(user.id);
        setUsedDates(data);
      }
    } catch (error) {
      console.error("Failed to load used dates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsedDates();
  }, [user]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Taken":
        return theme.colors.primary;
      case "Planning":
        return theme.colors.secondary;
      case "Wish":
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {usedDates.map((date) => (
          <Card key={date.id} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium">{date.equipmentId}</Text>
                <Text
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(date.type) },
                  ]}
                >
                  {date.type}
                </Text>
              </View>
              <View style={styles.dateContainer}>
                <Text variant="bodyMedium">
                  From: {format(new Date(date.startDate), "PPP")}
                </Text>
                <Text variant="bodyMedium">
                  To: {format(new Date(date.endDate), "PPP")}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push("/(tabs)/equipment")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: "white",
    fontSize: 12,
  },
  dateContainer: {
    gap: 4,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
