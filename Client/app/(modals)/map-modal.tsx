import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme, IconButton, ActivityIndicator, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LocationMap, { LocationMapRef } from '@/src/components/LocationMap';
import { Location } from '@/src/types/Location';
import * as LocationService from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/src/context/AuthContext';
import { showToast } from '@/src/components/Toast';
import * as equipmentApi from '@/src/api/equipmentApi';
import * as categoryApi from '@/src/api/categoryApi';
import { Equipment } from '@/src/types/Equipment';
import { Category } from '@/src/types/Category';
import { globalStyles } from '../../src/styles/globalStyles';
import { getCategoryLabel } from '@/src/utils/categoryUtils';

export default function MapModal() {
    const theme = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const mapRef = React.useRef<LocationMapRef>(null);
    const { t } = useTranslation();
    const { user } = useAuth();
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const selectedCategorySlug = params.category as string;
    const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>('');
    const isMountedRef = useRef(true);
    const initRunIdRef = useRef(0);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const getFormattedDistance = (distance: number): string => {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        }
        return `${distance.toFixed(1)}km`;
    };

    const getChildCategories = (parentCategorySlug: string, categoriesData: Category[]): string[] => {
        const parentCategory = categoriesData.find(c => c.slug === parentCategorySlug);
        if (!parentCategory) return [parentCategorySlug];

        const childCategories = categoriesData
            .filter(c => c.parentCategoryId === parentCategory.id)
            .map(c => c.slug);

        return [parentCategorySlug, ...childCategories];
    };

    const getCurrentLocation = useCallback(async (runId?: number) => {
        try {
            const { status } = await LocationService.requestForegroundPermissionsAsync();
            if (!isMountedRef.current || (runId && initRunIdRef.current !== runId)) return;
            if (status !== "granted") {
                showToast("error", t("location.errors.permissionDenied"));
                return;
            }

            const location = await LocationService.getCurrentPositionAsync({});
            if (!isMountedRef.current || (runId && initRunIdRef.current !== runId)) return;
            const currentLoc: Location = {
                id: "current",
                name: t("location.currentLocation"),
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                streetAddress: "",
                city: "",
                country: "",
                userId: user?.id || "",
            };
            setCurrentLocation(currentLoc);
            setLocations(prevLocations => {
                const withoutCurrent = prevLocations.filter(loc => loc.id !== "current");
                return [...withoutCurrent, currentLoc];
            });
        } catch (error) {
            console.error("Error getting current location:", error);
            if (isMountedRef.current && (!runId || initRunIdRef.current === runId)) {
                showToast("error", t("location.errors.locationFetchFailed"));
            }
        }
    }, [t, user?.id]);

    useEffect(() => {
        const runId = ++initRunIdRef.current;
        const initializeData = async () => {
            try {
                if (isMountedRef.current) {
                    setLoading(true);
                }
                // First fetch categories
                const categoriesData = await categoryApi.getCategories();
                if (!isMountedRef.current || initRunIdRef.current !== runId) return;
                console.log('Fetched Categories:', categoriesData);

                const selectedCategoryObj = categoriesData.find(c => c.slug === selectedCategorySlug);
                setSelectedCategoryLabel(selectedCategoryObj ? getCategoryLabel(selectedCategoryObj, t) : selectedCategorySlug);

                // Then fetch equipment and filter based on categories
                const equipmentData = await equipmentApi.getAll();
                if (!isMountedRef.current || initRunIdRef.current !== runId) return;

                // Get relevant categories based on selection
                const relevantCategories = selectedCategorySlug
                    ? getChildCategories(selectedCategorySlug, categoriesData)
                    : [];
                if (!isMountedRef.current || initRunIdRef.current !== runId) return;

                console.log('Relevant Categories:', relevantCategories);

                // Filter equipment by category if one is selected
                const filtered = selectedCategorySlug
                    ? equipmentData.filter(item => relevantCategories.includes(item.category.slug))
                    : equipmentData;

                setFilteredEquipment(filtered);
                console.log('Filtered Equipment:', filtered);

                // Get unique locations from filtered equipment
                const equipmentLocations = filtered
                    .map(item => item.location)
                    .filter((location, index, self) =>
                        location && index === self.findIndex(l => l?.id === location.id)
                    );

                console.log('Equipment Locations:', equipmentLocations);
                setLocations(equipmentLocations as Location[]);

                // Get current location
                await getCurrentLocation(runId);
            } catch (error) {
                console.error('Error initializing data:', error);
                if (isMountedRef.current && initRunIdRef.current === runId) {
                    showToast('error', t('location.errors.fetchFailed'));
                }
            } finally {
                if (isMountedRef.current && initRunIdRef.current === runId) {
                    setLoading(false);
                }
            }
        };

        initializeData();
    }, [getCurrentLocation, selectedCategorySlug, t]);

    const handleLocationSelect = (location: Location) => {
        mapRef.current?.animateToLocation(location);
    };

    const handleLocationClick = (location: Location) => {
        if (location.latitude && location.longitude) {
            mapRef.current?.animateToLocation(location);
        }
    };

    const handleBack = () => {
        router.push('/(tabs)/equipment');
    };

    const handleEquipmentPress = (equipment: Equipment) => {
        router.push(`/equipment/${equipment.id}`);
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, globalStyles.center]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
            <IconButton
                icon="arrow-left"
                size={24}
                onPress={handleBack}
                style={[globalStyles.backButton, { backgroundColor: theme.colors.surface }]}
            />
            {selectedCategorySlug && (
                <View style={[globalStyles.categoryContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={globalStyles.categoryText}>
                        {t('equipment.category')}: {selectedCategoryLabel}
                    </Text>
                </View>
            )}
            <View style={globalStyles.mapContainer}>
                <LocationMap
                    ref={mapRef}
                    locations={locations}
                    selectedLocation={currentLocation}
                    onLocationSelect={handleLocationSelect}
                    onLocationClick={handleLocationClick}
                />
            </View>
            <View style={[globalStyles.listContainer, { backgroundColor: theme.colors.background }]}>
                <View style={[globalStyles.headerRow, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[globalStyles.headerCell, globalStyles.nameCell, { color: theme.colors.onSurface }]}>{t('equipment.name')}</Text>
                    <Text style={[globalStyles.headerCell, globalStyles.categoryCell, { color: theme.colors.onSurface }]}>{t('equipment.category')}</Text>
                    <Text style={[globalStyles.headerCell, globalStyles.addressCell, { color: theme.colors.onSurface }]}>{t('location.address')}</Text>
                    <Text style={[globalStyles.headerCell, globalStyles.distanceCell, { color: theme.colors.onSurface }]}>{t('location.distance')}</Text>
                </View>
                <ScrollView>
                    {filteredEquipment.map((item) => {
                        const distance = currentLocation && item.location?.latitude && item.location?.longitude
                            ? calculateDistance(
                                currentLocation.latitude,
                                currentLocation.longitude,
                                item.location.latitude,
                                item.location.longitude
                            )
                            : null;

                        return (
                            <View
                                key={item.id}
                                style={[globalStyles.tableRow, { backgroundColor: theme.colors.surface }]}
                                onTouchEnd={() => handleEquipmentPress(item)}
                            >
                                <Text style={[globalStyles.tableCell, globalStyles.nameCell, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text style={[globalStyles.tableCell, globalStyles.categoryCell, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                    {getCategoryLabel(item.category, t)}
                                </Text>
                                <Text style={[globalStyles.tableCell, globalStyles.addressCell, { color: theme.colors.onSurface }]} numberOfLines={2}>
                                    {item.location ? `${item.location.streetAddress}, ${item.location.city}` : '-'}
                                </Text>
                                <Text style={[globalStyles.tableCell, globalStyles.distanceCell, { color: theme.colors.onSurface }]}>
                                    {distance !== null ? getFormattedDistance(distance) : '-'}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );
} 