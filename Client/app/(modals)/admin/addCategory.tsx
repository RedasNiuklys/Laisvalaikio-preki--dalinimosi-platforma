import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { TextInput, Button, Text, List, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createCategory } from '@/src/api/categoryApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OUTDOOR_ICONS } from '../../../src/assets/CategoryIcons';

export default function AddCategoryModal() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { t } = useTranslation();

    const filteredIcons = useMemo(() => {
        if (!searchQuery) return OUTDOOR_ICONS;
        const query = searchQuery.toLowerCase();
        return OUTDOOR_ICONS.filter(
            icon => icon.label.toLowerCase().includes(query) || icon.name.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await createCategory({
                name,
                description,
                iconName: selectedIcon,
            });
            router.back();
        } catch (error) {
            console.error('Error adding category:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                {t('admin.addCategory')}
            </Text>

            <TextInput
                label={t('admin.categoryName')}
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
            />

            <TextInput
                label={t('admin.categoryDescription')}
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('admin.selectIcon')}
            </Text>

            <Searchbar
                placeholder={t('admin.searchIcons')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <ScrollView style={styles.iconGrid}>
                <View style={styles.iconGridContainer}>
                    {filteredIcons.map((icon) => (
                        <Button
                            key={icon.name}
                            mode={selectedIcon === icon.name ? 'contained' : 'outlined'}
                            onPress={() => setSelectedIcon(icon.name)}
                            style={styles.iconButton}
                            contentStyle={styles.iconButtonContent}
                        >
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name={icon.name as any} size={24} />
                                <Text style={styles.iconLabel}>{icon.label}</Text>
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
            >
                {t('admin.saveCategory')}
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
        textAlign: 'center',
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 4,
    },
    iconButton: {
        width: 120,
        height: 80,
        padding: 0,
        margin: 0,
    },
    iconButtonContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLabel: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    button: {
        marginTop: 8,
    },
}); 