import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../../utils/envConfig';
import { getAuthToken } from '../../utils/authUtils';
import { globalStyles } from '../../styles/globalStyles';
import { UserSearch, User } from '../../components/UserSearch';

export const AddFriendPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const router = useRouter();

    const handleSendRequest = async (user: User) => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            const response = await axios.post(
                `${BASE_URL}/friendship/send`,
                { friendId: user.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(response.data);
            router.push('/friends');
        } catch (error) {
            console.error('Error sending friend request:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
            <View style={globalStyles.header}>
                <Text style={[globalStyles.title, { color: theme.colors.onBackground }]}>
                    Add Friend
                </Text>
                <Text style={[globalStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Search for users by name or email
                </Text>
            </View>
            <UserSearch
                onUserSelect={handleSendRequest}
                loading={loading}
            />
        </View>
    );
};