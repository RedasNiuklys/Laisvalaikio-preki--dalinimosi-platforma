import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../../utils/envConfig';
import { getAuthToken } from '../../utils/authUtils';
import { globalStyles } from '../../styles/globalStyles';

interface Friend {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
}

export const FriendProfilePage: React.FC = () => {
    const [friend, setFriend] = useState<Friend | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    useEffect(() => {
        loadFriend();
    }, [id]);

    const loadFriend = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            const response = await axios.get(`${BASE_URL}/friendship/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriend(response.data);
        } catch (error) {
            console.error('Error loading friend:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFriend = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            await axios.delete(`${BASE_URL}/friendship/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            router.back();
        } catch (error) {
            console.error('Error removing friend:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = () => {
        router.push(`/chat/${id}`);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, globalStyles.center]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!friend) {
        return (
            <View style={[globalStyles.container, globalStyles.center]}>
                <Text style={{ color: theme.colors.error }}>Friend not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={() => router.back()}
                    style={globalStyles.backButton}
                />
                <Avatar.Text
                    label={getInitials(friend.name)}
                    size={100}
                    style={[globalStyles.avatar, { backgroundColor: theme.colors.primary }]}
                />
                <Text style={[globalStyles.itemName, { color: theme.colors.onBackground }]}>
                    {friend.name}
                </Text>
                <Text style={[globalStyles.itemEmail, { color: theme.colors.onSurfaceVariant }]}>
                    {friend.email}
                </Text>
            </View>

            <View style={globalStyles.actions}>
                <Button
                    mode="contained"
                    onPress={handleStartChat}
                    style={[globalStyles.chatButton, { backgroundColor: theme.colors.primary }]}
                    icon="message"
                >
                    Start Chat
                </Button>
                <Button
                    mode="outlined"
                    onPress={handleRemoveFriend}
                    style={globalStyles.removeButton}
                    textColor={theme.colors.error}
                    icon="account-remove"
                >
                    Remove Friend
                </Button>
            </View>

            <View style={globalStyles.infoSection}>
                <Text style={[globalStyles.sectionTitle, { color: theme.colors.onBackground }]}>
                    Friend Since
                </Text>
                <Text style={[globalStyles.sectionContent, { color: theme.colors.onSurfaceVariant }]}>
                    {new Date(friend.createdAt).toLocaleDateString()}
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
    },
}); 