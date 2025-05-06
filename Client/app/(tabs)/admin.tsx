import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { List, Button, Text, Divider, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Category } from "@/src/types/Category";
import { deleteCategory, getCategories } from "@/src/api/categoryApi";
import EditDeleteButtons from "@/src/components/EditDeleteButtons";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  addButton: {
    marginTop: 16,
  },
});

export default function AdminScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId);
      loadCategories(); // Reload categories after deletion
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="headlineMedium"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        {t("admin.title")}
      </Text>

      <ScrollView>
        <List.Section>
          <List.Subheader style={{ color: theme.colors.onBackground }}>
            {t("admin.categories")}
          </List.Subheader>
          {categories.map((category) => (
            <React.Fragment key={category.id}>
              <List.Item
                title={category.name}
                description={category.description}
                titleStyle={{ color: theme.colors.onBackground }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                right={() => (
                  <EditDeleteButtons
                    onEdit={() => router.push(`/(modals)/admin/${category.id}`)}
                    onDelete={() => handleDeleteCategory(category.id)}
                  />
                )}
              />
              <Divider />
            </React.Fragment>
          ))}
        </List.Section>
      </ScrollView>

      <Button
        mode="contained"
        onPress={() => router.push("/(modals)/admin/addCategory")}
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        textColor={theme.colors.onPrimary}
      >
        {t("admin.addCategory")}
      </Button>
    </View>
  );
}
