import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { usePathname } from 'expo-router';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { colors, spacing } from '@/src/styles/globalStyles';

export default function GlobalHeader() {
    const theme = useTheme();
    const pathname = usePathname();

    const getTitle = () => {
        const path = pathname.split('/').pop() || '';
        switch (path) {
            case 'index':
                return 'Home';
            case 'equipment':
                return 'Equipment';
            case 'profile':
                return 'Profile';
            case 'settings':
                return 'Settings';
            case 'chat':
                return 'Messages';
            case 'admin':
                return 'Admin Panel';
            case 'about':
                return 'About';
            default:
                return path.charAt(0).toUpperCase() + path.slice(1);
        }
    };

    return (
        <View style={[
            styles.container,
            { backgroundColor: theme.colors.background }
        ]}>
            <Text
                variant="headlineSmall"
                style={[
                    styles.title,
                    { color: theme.colors.onSurface }
                ]}
            >
                {getTitle()}
            </Text>
            <View style={styles.togglesContainer}>
                <LanguageToggle />
                <ThemeToggle />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Platform.OS === 'web' ? spacing.lg : spacing.md,
        paddingVertical: spacing.md,
        minHeight: 64,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray5,
    },
    togglesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontWeight: '600',
        marginLeft: spacing.md,
    },
}); 