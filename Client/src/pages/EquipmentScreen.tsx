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
  IconButton,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { getByOwner } from "../api/equipmentApi";
import { Equipment, EquipmentImage } from "../types/Equipment";
import { useRouter } from "expo-router";
import { getCategories } from "../api/categoryApi";
import { Category } from "../types/Category";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const loadEquipment = async () => {
    try {
      if (user?.id) {
        const data = await getByOwner(user.id);
        setEquipment(data);
        console.log(data);
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
    if (!images || images.length === 0) return undefined;
    const mainImage = images.find((img) => img.isMainImage);
    return mainImage?.imageUrl || images[0]?.imageUrl;
  };

  const renderEquipmentCard = ({ item }: { item: Equipment }) => (
    <Card
      key={item.id}
      style={styles.equipmentCard}
      onPress={() => {
        router.push({
          pathname: "/(modals)/equipment/[id]",
          params: { id: item.id },
        });
      }}
    >
      {item.images && item.images.length > 0 && (
        <Card.Cover
          source={{ uri: getMainImage(item.images) }}
          style={styles.cardCover}
          resizeMode="cover"
        />
      )}
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" numberOfLines={1} style={styles.cardTitle}>
            {item.name}
          </Text>
          <Text
            variant="bodyMedium"
            numberOfLines={3}
            style={[
              styles.cardDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {item.description}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Chip
            mode="outlined"
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
                ? theme.colors.onPrimaryContainer
                : theme.colors.onErrorContainer,
            }}
            icon={({ size, color }) => (
              <MaterialCommunityIcons
                name={item.isAvailable ? "check-circle" : "close-circle"}
                size={size}
                color={color}
              />
            )}
          >
            {item.isAvailable
              ? t("equipment.available")
              : t("equipment.unavailable")}
          </Chip>
          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => {
                router.push({
                  pathname: "/(modals)/equipment/[id]",
                  params: { id: item.id },
                });
              }}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => {
                // Handle delete
              }}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCategoryChips = () => {
    // Sort categories: parent categories first, then their children
    const sortedCategories = [...categories].sort((a, b) => {
      if (a.parentCategoryId === null && b.parentCategoryId !== null) return -1;
      if (a.parentCategoryId !== null && b.parentCategoryId === null) return 1;
      if (a.parentCategoryId === b.parentCategoryId)
        return a.name.localeCompare(b.name);
      return 0;
    });

    return (
      <View style={styles.filtersContainer}>
        <Chip
          selected={selectedCategory === ""}
          onPress={() => setSelectedCategory("")}
          style={styles.categoryChip}
          icon={() => (
            <MaterialCommunityIcons
              name="filter-variant"
              size={16}
              color={theme.colors.primary}
            />
          )}
        >
          All
        </Chip>
        {sortedCategories.map((category) => (
          <Chip
            key={category.id}
            selected={selectedCategory === category.name}
            onPress={() => setSelectedCategory(category.name)}
            style={[
              styles.categoryChip,
              category.parentCategoryId === null && {
                backgroundColor: theme.colors.primaryContainer,
              },
              selectedCategory === category.name && {
                backgroundColor: theme.colors.primaryContainer,
                opacity: 0.8,
              },
            ]}
            icon={() => (
              <MaterialCommunityIcons
                name={category.iconName as any}
                size={16}
                color={theme.colors.primary}
              />
            )}
          >
            {category.name}
          </Chip>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Searchbar
        placeholder="Search equipment..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {renderCategoryChips()}

      {loading ? (
        <ActivityIndicator
          animating={true}
          size="large"
          style={styles.loadingIndicator}
        />
      ) : (
        <FlatList
          data={filteredEquipment}
          renderItem={renderEquipmentCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push("/(modals)/equipment/add-equipment")}
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
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBar: {
    marginBottom: 8,
  },
  gridContainer: {
    padding: 8,
  },
  equipmentCard: {
    flex: 1,
    margin: 8,
    maxWidth: "47%",
    elevation: 2,
    height: 400,
  },
  cardCover: {
    height: 240,
  },
  cardContent: {
    padding: 16,
    flex: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  cardDescription: {
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  statusChip: {
    flex: 1,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingIndicator: {
    marginTop: 16,
  },
});
