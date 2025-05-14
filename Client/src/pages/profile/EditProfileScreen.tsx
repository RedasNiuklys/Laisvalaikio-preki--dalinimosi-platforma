import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { showToast } from '@/src/components/Toast';
import { updateUser } from '@/src/api/userApi';
import { UpdateUserDto } from '@/src/types/User';

export default function EditProfileScreen() {
    const { user, updateUser: updateAuthUser } = useAuth();
    const [formData, setFormData] = useState<UpdateUserDto>({
        userName: user?.userName || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
    });
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const { t } = useTranslation();
    const router = useRouter();

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const updatedUser = await updateUser(user?.id || '', formData);
            updateAuthUser(updatedUser);
            showToast('success', t('profile.updateSuccess'));
            router.back();
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('error', t('profile.updateError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.form}>
                <TextInput
                    label={t('profile.userName')}
                    value={formData.userName}
                    onChangeText={(text) => setFormData({ ...formData, userName: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label={t('profile.firstName')}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label={t('profile.lastName')}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                >
                    {t('common.buttons.save')}
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: 16,
    },
    input: {
        marginBottom: 16,
    },
    submitButton: {
        marginTop: 8,
    },
}); 