import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Avatar, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../../utils/envConfig';
import { getAuthToken } from '../../utils/authUtils';
import { globalStyles } from '../../styles/globalStyles';

interface FriendRequest {
    id: string;
    requester: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
    createdAt: string;
}

export const FriendRequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const router = useRouter();

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            const response = await axios.get(`${BASE_URL}/friendship/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error('Error loading friend requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (requestId: string, accept: boolean) => {
        try {
            const token = await getAuthToken();
            await axios.post(
                `${BASE_URL}/friendship/${requestId}/${accept ? 'accept' : 'reject'}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRequests(requests.filter(req => req.id !== requestId));
        } catch (error) {
            console.error('Error handling friend request:', error);
        }
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

    return (
        <View style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
            <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => router.push('/friends')}
                style={globalStyles.backButton}
            />
            <FlatList
                data={requests}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={[globalStyles.listItem, { backgroundColor: theme.colors.surface }]}>
                        <Avatar.Text
                            label={getInitials(item.requester.name)}
                            size={50}
                            style={[globalStyles.avatar, { backgroundColor: theme.colors.primary }]}
                        />
                        <View style={globalStyles.itemInfo}>
                            <Text style={[globalStyles.itemName, { color: theme.colors.onSurface }]}>
                                {item.requester.name}
                            </Text>
                            <Text style={[globalStyles.itemEmail, { color: theme.colors.onSurfaceVariant }]}>
                                {item.requester.email}
                            </Text>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button
                                mode="contained"
                                onPress={() => handleRequest(item.id, true)}
                                style={[styles.acceptButton, { backgroundColor: theme.colors.primary }]}
                            >
                                Accept
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => handleRequest(item.id, false)}
                                style={globalStyles.removeButton}
                                textColor={theme.colors.error}
                            >
                                Reject
                            </Button>
                        </View>
                    </View>
                )}
                contentContainerStyle={globalStyles.listContent}
                ListEmptyComponent={
                    <View style={globalStyles.emptyContainer}>
                        <Text style={[globalStyles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                            No pending requests
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    acceptButton: {
        marginRight: 8,
    },
}); 