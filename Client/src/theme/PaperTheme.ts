import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#007BFF',
        secondary: '#28A745',
        error: '#DC3545',
        background: '#F8F8F8',
        surface: '#FFFFFF',
        text: '#333333',
        onSurface: '#333333',
        onBackground: '#333333',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onError: '#FFFFFF',
        success: '#28A745',
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#1E90FF',
        secondary: '#32CD32',
        error: '#FF6347',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#E0E0E0',
        onSurface: '#E0E0E0',
        onBackground: '#E0E0E0',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onError: '#FFFFFF',
        success: '#32CD32',
    },
}; 