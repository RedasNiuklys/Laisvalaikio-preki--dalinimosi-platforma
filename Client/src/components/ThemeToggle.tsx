import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useTheme as useAppTheme } from '@/src/context/ThemeContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/src/context/AuthContext";
import { updateUserThemePreference } from '../api/userApi';

export default function ThemeToggle() {
    const { isDarkMode, toggleTheme } = useAppTheme();
    const theme = useTheme();
    const { user, loadUser } = useAuth();
    const spinValue = new Animated.Value(0);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        Animated.timing(spinValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            spinValue.setValue(0);
        });
    }, [isDarkMode]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleThemeToggle = async () => {
        if (isUpdating) return; // Prevent multiple simultaneous updates

        try {
            setIsUpdating(true);
            const newTheme = !isDarkMode;

            // First update local state
            toggleTheme();

            // Save to AsyncStorage
            await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");

            // If user is logged in, update their theme preference in the backend
            if (user?.id) {
                try {
                    await updateUserThemePreference(newTheme ? "dark" : "light");
                    // Reload user data to ensure sync
                    await loadUser();
                } catch (error) {
                    console.error("Error updating theme in backend:", error);
                    // Revert local changes if backend update fails
                    toggleTheme();
                    await AsyncStorage.setItem("theme", isDarkMode ? "dark" : "light");
                }
            }
        } catch (error) {
            console.error("Error saving theme preference:", error);
            // Revert local changes if anything fails
            toggleTheme();
            await AsyncStorage.setItem("theme", isDarkMode ? "dark" : "light");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <IconButton
                icon={isDarkMode ? 'weather-night' : 'weather-sunny'}
                size={24}
                iconColor={theme.colors.primary}
                onPress={handleThemeToggle}
                disabled={isUpdating}
            />
        </Animated.View>
    );
} 