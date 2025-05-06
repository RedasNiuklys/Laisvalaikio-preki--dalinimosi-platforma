import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput as RNTextInput,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  List,
  Searchbar,
  useTheme,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  getCategoryById,
  updateCategory,
  getCategories,
} from "@/src/api/categoryApi";
import { Category } from "@/src/types/Category";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const OUTDOOR_ICONS = [
  { name: "snowboard" as const, label: "Snowboard" },
  { name: "grill" as const, label: "BBQ" },
  { name: "roller-skate" as const, label: "Rollerblades" },
  { name: "bike" as const, label: "Bicycle" },
  { name: "ski" as const, label: "Ski" },
  { name: "fish" as const, label: "Fishing" },
  { name: "hiking" as const, label: "Hiking" },
  { name: "kayaking" as const, label: "Kayaking" },
  { name: "surfing" as const, label: "Surfing" },
  { name: "golf" as const, label: "Golf" },
  { name: "tennis" as const, label: "Tennis" },
  { name: "basketball" as const, label: "Basketball" },
  { name: "soccer" as const, label: "Soccer" },
  { name: "volleyball" as const, label: "Volleyball" },
  { name: "tent" as const, label: "Camping" },
  { name: "hockey-puck" as const, label: "Hockey" },
  { name: "swim" as const, label: "Swimming" },
  { name: "run" as const, label: "Running" },
  { name: "yoga" as const, label: "Yoga" },
];

export default function EditCategoryModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return OUTDOOR_ICONS;
    const query = searchQuery.toLowerCase();
    return OUTDOOR_ICONS.filter(
      (icon) =>
        icon.label.toLowerCase().includes(query) ||
        icon.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const parentCategories = useMemo(() => {
    return categories.filter((cat) => !cat.parentCategoryId);
  }, [categories]);

  useEffect(() => {
    loadCategory();
    loadCategories();
  }, [id]);

  const loadCategory = async () => {
    try {
      const data = await getCategoryById(Number(id));
      setCategory(data);
      setName(data.name);
      setDescription(data.description);
      setSelectedIcon(data.iconName);
      setSelectedParentId(data.parentCategoryId ?? null);
    } catch (error) {
      console.error("Error loading category:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await updateCategory(Number(id), {
        name,
        description,
        iconName: selectedIcon,
        parentCategoryId: selectedParentId ?? undefined,
      });
      router.back();
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!category) {
    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        {t("admin.editCategory")}
      </Text>

      <TextInput
        label={t("admin.categoryName")}
        value={name}
        onChangeText={setName}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: theme.colors.primary } }}
      />

      <TextInput
        label={t("admin.categoryDescription")}
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        theme={{ colors: { primary: theme.colors.primary } }}
      />

      <Text
        variant="titleMedium"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        {t("admin.selectParentCategory")}
      </Text>

      <View style={styles.parentCategoryContainer}>
        {parentCategories.map((parent) => (
          <Button
            key={parent.id}
            mode={selectedParentId === parent.id ? "contained" : "outlined"}
            onPress={() => setSelectedParentId(parent.id)}
            style={[
              styles.parentCategoryButton,
              selectedParentId === parent.id && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
            textColor={
              selectedParentId === parent.id
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurfaceVariant
            }
          >
            {parent.name}
          </Button>
        ))}
      </View>

      <Text
        variant="titleMedium"
        style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
      >
        {t("admin.selectIcon")}
      </Text>

      <Searchbar
        placeholder={t("admin.searchIcons")}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        theme={{ colors: { primary: theme.colors.primary } }}
      />

      <ScrollView style={styles.iconGrid}>
        <View style={styles.iconGridContainer}>
          {filteredIcons.map((icon) => (
            <Button
              key={icon.name}
              mode={selectedIcon === icon.name ? "contained" : "outlined"}
              onPress={() => setSelectedIcon(icon.name)}
              style={[
                styles.iconButton,
                selectedIcon === icon.name && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              contentStyle={styles.iconButtonContent}
              textColor={
                selectedIcon === icon.name
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant
              }
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={icon.name as any}
                  size={24}
                  color={
                    selectedIcon === icon.name
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.iconLabel,
                    {
                      color:
                        selectedIcon === icon.name
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {icon.label}
                </Text>
              </View>
            </Button>
          ))}
        </View>
      </ScrollView>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={!name || !selectedIcon || loading}
        style={styles.button}
        theme={{ colors: { primary: theme.colors.primary } }}
      >
        {t("admin.saveCategory")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  searchBar: {
    marginBottom: 16,
  },
  iconGrid: {
    flex: 1,
    marginBottom: 16,
  },
  iconGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 4,
  },
  iconButton: {
    width: 160,
    height: 80,
    padding: 0,
    margin: 0,
  },
  iconButtonContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
  },
  parentCategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  parentCategoryButton: {
    marginBottom: 8,
  },
});
