import React from 'react';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { AddFriendPage } from '../../src/pages/friends/AddFriendPage';
import { globalStyles } from '../../src/styles/globalStyles';

export default function AddFriendScreen() {
    const router = useRouter();

    return (
        <>
            <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => router.push('/friends')}
                style={globalStyles.backButton}
            />
            <AddFriendPage />
        </>
    );
} 