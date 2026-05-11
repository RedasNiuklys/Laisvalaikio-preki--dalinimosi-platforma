import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
  Chip,
  Portal,
  Dialog,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { Category, CategoryEdit } from "../types/Category";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
} from "../api/categoryApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { showToast } from "../components/Toast";
import { useTranslation } from "react-i18next";
import { getCategoryLabel, toCategorySlug } from "../utils/categoryUtils";

interface AdminCategoryScreenProps {
  categoryId?: number;
}

export default function AdminCategoryScreen({
  categoryId,
}: AdminCategoryScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [category, setCategory] = useState<CategoryEdit>({
    name: "",
    slug: "",
    iconName: "tag",
    parentCategoryId: undefined,
    description: "",
  });

  useEffect(() => {
    loadCategories();
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      showToast("error", t("category.loadError"));
    }
  };

  const loadCategory = async () => {
    try {
      const data = await getCategoryById(categoryId!);
      setCategory({
        ...data,
        slug: data.slug || toCategorySlug(data.name),
      });
      setSelectedParentId(data.parentCategoryId ?? null);
    } catch (error) {
      console.error("Failed to load category:", error);
      showToast("error", t("category.loadError"));
    }
  };

  const handleSubmit = async () => {
    if (!category.name.trim()) {
      showToast("error", t("category.nameRequired"));
      return;
    }

    const normalizedSlug = toCategorySlug(category.slug || category.name);
    if (!normalizedSlug) {
      showToast("error", t("category.slugRequired", { defaultValue: "Category slug is required" }));
      return;
    }

    if (!category.iconName.trim()) {
      showToast("error", t("category.iconRequired", { defaultValue: "Category icon name is required" }));
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        ...category,
        slug: normalizedSlug,
        iconName: category.iconName.trim(),
        parentCategoryId: selectedParentId,
      };

      if (categoryId) {
        await updateCategory(categoryId, categoryData as Partial<Category>);
        showToast("success", t("category.updateSuccess"));
      } else {
        await createCategory(
          categoryData as Omit<Category, "id" | "createdAt" | "updatedAt">
        );
        showToast("success", t("category.createSuccess"));
      }
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.warn('Navigation error:', error);
        router.replace('/');
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      showToast("error", t("category.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(categoryId!);
      showToast("success", t("category.deleteSuccess"));
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.warn('Navigation error:', error);
        router.replace('/');
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      showToast("error", t("category.deleteError"));
    }
  };

  const availableParentCategories = categories.filter(
    (c) => c.id !== categoryId && c.parentCategoryId === null
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <TextInput
          label={t("category.name")}
          value={category.name}
          onChangeText={(text) =>
            setCategory((prev) => ({
              ...prev,
              name: text,
              slug: prev.slug ? prev.slug : toCategorySlug(text),
            }))
          }
          style={styles.input}
        />

        <TextInput
          label={t("category.slug", { defaultValue: "Slug" })}
          value={category.slug}
          onChangeText={(text) => setCategory({ ...category, slug: toCategorySlug(text) })}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. winter-sports"
        />

        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {t("category.parentCategory")}
        </Text>
        <View
          style={[
            styles.pickerContainer,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View style={styles.iconContainer}>
            <Chip
              selected={selectedParentId === null}
              onPress={() => setSelectedParentId(null)}
              style={styles.iconChip}
              icon={() => (
                <MaterialCommunityIcons
                  name="tag"
                  size={16}
                  color={theme.colors.primary}
                />
              )}
            >
              {t("category.noParent")}
            </Chip>
            {availableParentCategories.map((parent) => (
              <Chip
                key={parent.id}
                selected={selectedParentId === parent.id}
                onPress={() => setSelectedParentId(parent.id)}
                style={styles.iconChip}
                icon={() => (
                  <MaterialCommunityIcons
                    name={parent.iconName as any}
                    size={16}
                    color={theme.colors.primary}
                  />
                )}
              >
                {getCategoryLabel(parent, t)}
              </Chip>
            ))}
          </View>
        </View>

        <TextInput
          label={t("category.icon", { defaultValue: "Icon name" })}
          value={category.iconName}
          onChangeText={(text) => setCategory({ ...category, iconName: text })}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="MaterialCommunityIcons name, e.g. snowboard"
        />

        <View style={styles.iconContainer}>
          {["tag", "tag-multiple", "snowboard", "waves", "weather-sunny", "bicycle"].map((icon) => (
            <Chip
              key={icon}
              selected={category.iconName === icon}
              onPress={() => setCategory({ ...category, iconName: icon })}
              style={styles.iconChip}
              icon={() => (
                <MaterialCommunityIcons
                  name={icon as any}
                  size={16}
                  color={theme.colors.primary}
                />
              )}
            >
              {icon}
            </Chip>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          {categoryId ? t("common.update") : t("common.create")}
        </Button>

        {categoryId && (
          <Button
            mode="contained"
            onPress={() => setDeleteDialogVisible(true)}
            buttonColor={theme.colors.error}
            style={styles.button}
          >
            {t("common.delete")}
          </Button>
        )}
      </View>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>{t("category.deleteConfirmTitle")}</Dialog.Title>
          <Dialog.Content>
            <Text>{t("category.deleteConfirmMessage")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              {t("common.buttons.cancel")}
            </Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              {t("common.delete")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  picker: {
    height: 50,
  },
  iconContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  iconChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});
