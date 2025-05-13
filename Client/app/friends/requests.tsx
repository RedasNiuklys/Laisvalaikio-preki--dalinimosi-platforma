import React from 'react';
import { FriendRequestsPage } from '../../src/pages/friends/FriendRequestsPage';
import { IconButton } from 'react-native-paper';
import { globalStyles } from '@/src/styles/globalStyles';
import { useRouter } from 'expo-router';

export default function FriendRequestsScreen() {
    const router = useRouter();
    return (
        <>
            <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => router.push('/friends')
                }
                style={globalStyles.backButton}
            />
            <FriendRequestsPage />
        </>
    )
} 