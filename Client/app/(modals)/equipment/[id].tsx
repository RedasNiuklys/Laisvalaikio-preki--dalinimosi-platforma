import { useLocalSearchParams, useRouter } from 'expo-router';
import EquipmentDetailsPage from '@/src/pages/equipment/EquipmentDetailsPage';
import { Appbar, IconButton } from 'react-native-paper';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
export default function EquipmentDetailsModal() {
    const { id } = useLocalSearchParams();
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.push('/equipment')} />
                <Appbar.Content title={t('equipment.details.title')} />
            </Appbar.Header>
            <EquipmentDetailsPage id={id as string} />
        </View>
    );
}
