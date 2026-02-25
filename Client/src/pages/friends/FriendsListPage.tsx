import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Avatar, Button, ActivityIndicator, IconButton, FAB, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/envConfig';
import { getAuthToken } from '../../utils/authUtils';
import { globalStyles } from '../../styles/globalStyles';
import { UserSearch } from '../../components/UserSearch';
import { NewChatModal } from '../../components/NewChatModal';
import { useAuth } from '../../context/AuthContext';
import { useFacebookInvite } from '../../hooks/useFacebookInvite';
import { showToast } from '../../components/Toast';

interface Friend {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

interface Chat {
    id: number;
    name?: string;
    isGroupChat: boolean;
    participants: {
        id: string;
        name: string;
        avatarUrl?: string;
    }[];
    lastMessage?: {
        content: string;
        sentAt: string;
    };
}

export const FriendsListPage: React.FC = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [hasFacebookToken, setHasFacebookToken] = useState(false);
    const theme = useTheme();
    const router = useRouter();
    const { authProvider } = useAuth();
    const { inviteFriends, loading: inviteLoading } = useFacebookInvite();

    useEffect(() => {
        loadFriends();
        loadChats();
    }, []);

    useEffect(() => {
        const checkFacebookToken = async () => {
            try {
                const token = await AsyncStorage.getItem('facebookAccessToken');
                setHasFacebookToken(Boolean(token));
            } catch (error) {
                console.warn('Failed to read facebookAccessToken:', error);
                setHasFacebookToken(false);
            }
        };

        checkFacebookToken();
    }, []);

    const loadFriends = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            const response = await axios.get(`${BASE_URL}/friendship/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriends(response.data);
        } catch (error) {
            console.error('Error loading friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChats = async () => {
        try {
            const token = await getAuthToken();
            const response = await axios.get(`${BASE_URL}/chat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChats(response.data);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const handleUserSelect = async (user: Friend) => {
        try {
            const token = await getAuthToken();
            const response = await axios.post(`${BASE_URL}/chat/create`, {
                isGroupChat: false,
                participantIds: [user.id]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            router.push(`/(modals)/chat/${response.data.chatId}`);
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    const handleChatCreated = (chatId: number) => {
        router.push(`/(modals)/chat/${chatId}`);
        loadChats();
    };

    const handleInviteFriends = async () => {
        const result = await inviteFriends();
        if (result.success) {
            showToast(
                'success',
                `Invitations sent to ${result.invitedCount || 'friends'} friends!`
            );
        } else {
            showToast('error', result.error || 'Failed to send invitations');
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
            <UserSearch onUserSelect={handleUserSelect} />

            {(authProvider === 'facebook' || hasFacebookToken) && (
                <View style={styles.inviteContainer}>
                    <Button
                        mode="contained"
                        onPress={handleInviteFriends}
                        loading={inviteLoading}
                        disabled={inviteLoading}
                        style={styles.inviteButton}
                        icon="facebook"
                    >
                        Invite Facebook Friends
                    </Button>
                </View>
            )}

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    Friends
                </Text>
                <FlatList
                    data={friends}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={[globalStyles.listItem, { backgroundColor: theme.colors.surface }]}>
                            <Avatar.Text
                                label={getInitials(item.name)}
                                size={50}
                                style={[globalStyles.avatar, { backgroundColor: theme.colors.primary }]}
                            />
                            <View style={globalStyles.itemInfo}>
                                <Text style={[globalStyles.itemName, { color: theme.colors.onSurface }]}>
                                    {item.name}
                                </Text>
                                <Text style={[globalStyles.itemEmail, { color: theme.colors.onSurfaceVariant }]}>
                                    {item.email}
                                </Text>
                            </View>
                            <IconButton
                                icon="message"
                                size={24}
                                onPress={() => handleUserSelect(item)}
                                style={styles.chatButton}
                            />
                        </View>
                    )}
                    contentContainerStyle={globalStyles.listContent}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                            No friends yet
                        </Text>
                    }
                />
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    Group Chats
                </Text>
                <FlatList
                    data={chats.filter(chat => chat.isGroupChat)}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={[globalStyles.listItem, { backgroundColor: theme.colors.surface }]}>
                            <Avatar.Text
                                label={getInitials(item.name || 'Group')}
                                size={50}
                                style={[globalStyles.avatar, { backgroundColor: theme.colors.primary }]}
                            />
                            <View style={globalStyles.itemInfo}>
                                <Text style={[globalStyles.itemName, { color: theme.colors.onSurface }]}>
                                    {item.name || 'Group Chat'}
                                </Text>
                                <Text style={[globalStyles.itemEmail, { color: theme.colors.onSurfaceVariant }]}>
                                    {item.participants.length} members
                                </Text>
                            </View>
                            <IconButton
                                icon="message"
                                size={24}
                                onPress={() => router.push(`/(modals)/chat/${item.id}`)}
                                style={styles.chatButton}
                            />
                        </View>
                    )}
                    contentContainerStyle={globalStyles.listContent}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                            No group chats yet
                        </Text>
                    }
                />
            </View>

            <FAB
                icon="account-group"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowNewChatModal(true)}
                color={theme.colors.onPrimary}
            />

            <NewChatModal
                visible={showNewChatModal}
                onDismiss={() => setShowNewChatModal(false)}
                onChatCreated={handleChatCreated}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        flex: 1,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
        marginBottom: 8,
    },
    chatButton: {
        marginLeft: 'auto',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 16,
    },
    inviteContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inviteButton: {
        marginTop: 8,
    },
}); 