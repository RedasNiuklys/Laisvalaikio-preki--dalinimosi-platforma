import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import {
    Text,
    Card,
    useTheme,
    Button,
    ActivityIndicator,
    IconButton,
    Divider,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import LocationMap from "@/src/components/LocationMap";
import * as equipmentApi from "@/src/api/equipmentApi";
import { Equipment } from "@/src/types/Equipment";
import { showToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function EquipmentDetailsPage() {
    const { id } = useLocalSearchParams();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetchEquipmentDetails();
    }, [id]);

    const fetchEquipmentDetails = async () => {
        try {
            setLoading(true);
            const data = await equipmentApi.getById(id as string);
            setEquipment(data);
        } catch (error) {
            console.error("Error fetching equipment details:", error);
            showToast("error", t("equipment.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!equipment) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
                <Text>{t("equipment.errors.notFound")}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Image
                source={{ uri: equipment.imageUrl }}
                style={styles.image}
                resizeMode="cover"
            />

            <View style={styles.content}>
                <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                    {equipment.name}
                </Text>

                <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                            {t("equipment.details.info")}
                        </Text>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons
                                name="tag"
                                size={20}
                                color={theme.colors.primary}
                            />
                            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>{equipment.category}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons
                                name="information"
                                size={20}
                                color={theme.colors.primary}
                            />
                            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>{equipment.description}</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                            {t("equipment.details.location")}
                        </Text>
                        <View style={styles.mapContainer}>
                            <LocationMap
                                locations={[equipment.location]}
                                selectedLocation={equipment.location}
                                initialRegion={{
                                    latitude: equipment.location.latitude,
                                    longitude: equipment.location.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                            />
                        </View>
                        <View style={styles.locationInfo}>
                            <Text style={{ color: theme.colors.onSurface }}>{equipment.location.streetAddress}</Text>
                            <Text style={{ color: theme.colors.onSurface }}>
                                {equipment.location.city}, {equipment.location.country}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                            {t("equipment.details.availability")}
                        </Text>
                        {equipment.usedDates && equipment.usedDates.length > 0 ? (
                            equipment.usedDates.map((date, index) => (
                                <View key={index} style={[styles.dateRow, { borderBottomColor: theme.colors.outline }]}>
                                    <Text style={{ color: theme.colors.onSurface }}>
                                        {new Date(date.start).toLocaleDateString()} -{" "}
                                        {new Date(date.end).toLocaleDateString()}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: theme.colors.onSurface }}>{t("equipment.details.noDates")}</Text>
                        )}
                    </Card.Content>
                </Card>

                {user?.id === equipment.userId && (
                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            onPress={() => router.push(`/equipment/${id}/edit`)}
                            style={styles.editButton}
                        >
                            {t("common.buttons.edit")}
                        </Button>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    image: {
        width: "100%",
        height: 300,
    },
    content: {
        padding: 16,
    },
    title: {
        marginBottom: 16,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
    },
    mapContainer: {
        height: 200,
        marginBottom: 8,
        borderRadius: 8,
        overflow: "hidden",
    },
    locationInfo: {
        marginTop: 8,
    },
    dateRow: {
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    actions: {
        marginTop: 16,
    },
    editButton: {
        marginBottom: 16,
    },
}); 