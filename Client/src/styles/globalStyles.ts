import { StyleSheet } from 'react-native';

export const colors = {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    info: '#5856D6',
    light: '#F2F2F7',
    dark: '#1C1C1E',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#8E8E93',
    gray2: '#AEAEB2',
    gray3: '#C7C7CC',
    gray4: '#D1D1D6',
    gray5: '#E5E5EA',
    gray6: '#F2F2F7',
    charcoal: '#2C2C2E',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    h3: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    body: {
        fontSize: 16,
    },
    caption: {
        fontSize: 14,
    },
    small: {
        fontSize: 12,
    },
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 8,
        padding: spacing.md,
        marginVertical: spacing.sm,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: colors.gray3,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        marginVertical: spacing.sm,
    },
    button: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonSecondary: {
        backgroundColor: colors.secondary,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: colors.danger,
        fontSize: 14,
        marginTop: spacing.xs,
    },
    successText: {
        color: colors.success,
        fontSize: 14,
        marginTop: spacing.xs,
    },
}); 