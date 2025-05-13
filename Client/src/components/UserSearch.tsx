import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, List, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import axios from 'axios';
import { BASE_URL } from '../utils/envConfig';
import { getAuthToken } from '../utils/authUtils';
import { globalStyles, colors } from '../styles/globalStyles';
import { useAuth } from '../context/AuthContext';

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    hasPendingRequest?: boolean;
}

interface Friendship {
    id: string;
    requester: User;
    createdAt: string;
}

interface UserSearchProps {
    onUserSelect: (user: User) => void;
    loading?: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, loading: parentLoading }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const { user, loadUser } = useAuth();
    const [pendingUserIds, setPendingUserIds] = useState<{ userId: string, currentUserPending: boolean }[]>([]);
    const theme = useTheme();

    useEffect(() => {
        loadUser();
        const searchUsers = async () => {
            if (searchQuery.length < 2) {
                setUsers([]);
                return;
            }

            try {
                setLoading(true);
                const token = await getAuthToken();
                const searchResponse = await axios.get<User[]>(`${BASE_URL}/user/search`, {
                    params: { searchQuery: searchQuery },
                    headers: { Authorization: `Bearer ${token}` }
                });

                const usersWithPendingStatus = await Promise.all(searchResponse.data.map(async reqUser => {
                    const res = await axios.get<Friendship[]>(`${BASE_URL}/friendship/pending/${reqUser.id}`, {
                        params: { forCurrentUser: true },
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const currentUserPending = res.data.some((req: any) => req.requester.id === user?.id);
                    return {
                        ...reqUser,
                        hasPendingRequest: currentUserPending
                    };
                }));
                setUsers(usersWithPendingStatus);

            } catch (error) {
                console.error('Error searching users:', error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search users..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
            />
            {(loading || parentLoading) ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <List.Section>
                    {users.map(user => (
                        <List.Item
                            key={user.id}
                            title={user.name}
                            description={user.email}
                            left={() => (
                                <Avatar.Text
                                    label={getInitials(user.name)}
                                    size={40}
                                    style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                                />
                            )}
                            right={() => user.hasPendingRequest && (
                                <Chip
                                    mode="outlined"
                                    style={styles.pendingChip}
                                    textStyle={{ color: theme.colors.primary }}
                                >
                                    Pending
                                </Chip>
                            )}
                            onPress={() => !user.hasPendingRequest && onUserSelect(user)}
                            style={[
                                styles.listItem,
                                user.hasPendingRequest && styles.disabledItem
                            ]}
                        />
                    ))}
                </List.Section>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchbar: {
        margin: 16,
        marginBottom: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        marginRight: 8,
    },
    listItem: {
        paddingVertical: 8,
    },
    disabledItem: {
        opacity: 0.7,
    },
    pendingChip: {
        marginRight: 8,
        borderColor: colors.primary,
    },
}); 