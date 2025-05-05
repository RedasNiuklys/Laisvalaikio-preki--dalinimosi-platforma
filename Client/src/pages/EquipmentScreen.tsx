import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import {
  Text,
  Card,
  useTheme,
  FAB,
  Searchbar,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { getByOwner } from "../api/equipmentApi";
import { Equipment, EquipmentImage } from "../types/Equipment";
import { useNavigation } from "@react-navigation/native";
import { getCategories } from "../api/categoryApi";
import { Category } from "../types/Category";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation();

  const loadEquipment = async () => {
    try {
      if (user?.id) {
        const data = await getByOwner(user.id);
        setEquipment(data);
        setFilteredEquipment(data);
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      // Sort categories: parent categories first, then their children
      const sortedCategories = data.sort((a, b) => {
        if (a.parentCategoryId === null && b.parentCategoryId !== null)
          return -1;
        if (a.parentCategoryId !== null && b.parentCategoryId === null)
          return 1;
        if (a.parentCategoryId === b.parentCategoryId)
          return a.name.localeCompare(b.name);
        return 0;
      });
      setCategories(sortedCategories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadEquipment();
  }, []);

  useEffect(() => {
    let filtered = equipment;

    // Apply category filter
    if (selectedCategory) {
      const selectedCategoryObj = categories.find(
        (c) => c.name === selectedCategory
      );
      if (selectedCategoryObj) {
        if (selectedCategoryObj.parentCategoryId === null) {
          // If parent category is selected, show all its children
          const childCategories = categories
            .filter((c) => c.parentCategoryId === selectedCategoryObj.id)
            .map((c) => c.name);
          filtered = filtered.filter(
            (item) =>
              childCategories.includes(item.category) ||
              item.category === selectedCategory
          );
        } else {
          // If child category is selected, show only that category
          filtered = filtered.filter(
            (item) => item.category === selectedCategory
          );
        }
      }
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEquipment(filtered);
  }, [searchQuery, selectedCategory, equipment, categories]);

  const getMainImage = (images: EquipmentImage[]) => {
    return (
      images.find((img) => img.isMainImage)?.imageUrl || images[0]?.imageUrl
    );
  };

  const renderEquipmentCard = ({ item }: { item: Equipment }) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate("EquipmentDetails", { equipmentId: item.id })
      }
    >
      {item.images && item.images.length > 0 && (
        <Card.Cover
          source={{ uri: getMainImage(item.images) }}
          style={styles.cardImage}
        />
      )}
      <Card.Content style={styles.cardContent}>
        <Text
          variant="titleMedium"
          style={[styles.cardTitle, { color: theme.colors.onSurface }]}
        >
          {item.name}
        </Text>
        <Text
          variant="bodyMedium"
          numberOfLines={2}
          style={[
            styles.cardDescription,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Chip
            style={styles.categoryChip}
            textStyle={{ color: theme.colors.primary }}
            icon={() => (
              <MaterialCommunityIcons
                name="tag"
                size={16}
                color={theme.colors.primary}
              />
            )}
          >
            {item.category}
          </Chip>
          <Chip
            style={[
              styles.statusChip,
              {
                backgroundColor: item.isAvailable
                  ? theme.colors.primaryContainer
                  : theme.colors.errorContainer,
              },
            ]}
            textStyle={{
              color: item.isAvailable
                ? theme.colors.primary
                : theme.colors.error,
            }}
            icon={() => (
              <MaterialCommunityIcons
                name={item.isAvailable ? "check-circle" : "close-circle"}
                size={16}
                color={
                  item.isAvailable ? theme.colors.primary : theme.colors.error
                }
              />
            )}
          >
            {item.isAvailable ? "Available" : "Unavailable"}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search equipment..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          <Chip
            selected={!selectedCategory}
            onPress={() => setSelectedCategory("")}
            style={styles.categoryChip}
            textStyle={{ color: theme.colors.primary }}
            icon={() => (
              <MaterialCommunityIcons
                name="apps"
                size={16}
                color={theme.colors.primary}
              />
            )}
          >
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.name}
              onPress={() => setSelectedCategory(category.name)}
              style={[
                styles.categoryChip,
                category.parentCategoryId === null && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              textStyle={{
                color:
                  category.parentCategoryId === null
                    ? theme.colors.primary
                    : theme.colors.onSurface,
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name={category.iconName as any}
                  size={16}
                  color={
                    category.parentCategoryId === null
                      ? theme.colors.primary
                      : theme.colors.onSurface
                  }
                />
              )}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredEquipment}
        renderItem={renderEquipmentCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate("AddEquipment")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBar: {
    marginBottom: 8,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  gridContainer: {
    padding: 8,
  },
  card: {
    flex: 1,
    margin: 8,
    maxWidth: "47%",
    elevation: 2,
  },
  cardImage: {
    height: 120,
  },
  cardContent: {
    padding: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDescription: {
    color: "#666",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryChip: {
    marginRight: 4,
  },
  statusChip: {
    marginLeft: 4,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
