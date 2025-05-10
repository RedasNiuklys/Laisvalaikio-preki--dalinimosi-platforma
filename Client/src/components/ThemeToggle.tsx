import React, { useEffect } from 'react';
import { TouchableOpacity, Animated, Platform } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useTheme as useAppTheme } from '@/src/context/ThemeContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/src/context/AuthContext";
import { updateUserThemePreference } from '../api/userApi';

export default function ThemeToggle() {
    const { isDarkMode, toggleTheme } = useAppTheme();
    const theme = useTheme();
    const { user } = useAuth();
    const spinValue = new Animated.Value(0);

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
        const newTheme = !isDarkMode;
        toggleTheme();

        if (Platform.OS !== "web") {
            try {
                // Save theme preference to AsyncStorage
                await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");

                // If user is logged in, update their theme preference in the backend
                if (user) {
                    // TODO: Add API call to update user's theme preference
                    await updateUserThemePreference(user.id as string, newTheme ? "dark" : "light");
                }
            } catch (error) {
                console.error("Error saving theme preference:", error);
            }
        }
    };

    return (
        <TouchableOpacity
            style={{
                position: 'absolute',
                top: 4,
                right: 16,
                zIndex: 1,
            }}
            onPress={handleThemeToggle}
        >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <IconButton
                    icon={isDarkMode ? 'weather-night' : 'weather-sunny'}
                    size={24}
                    iconColor={theme.colors.onSurface}
                />
            </Animated.View>
        </TouchableOpacity>
    );
} 