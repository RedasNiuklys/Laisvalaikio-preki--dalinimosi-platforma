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
        // shadowColor: colors.black,
        // shadowOffset: {
        //     width: 0,
        //     height: 2,
        // },
        // shadowOpacity: 0.1,
        // shadowRadius: 4,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
    // Map Modal Styles
    mapContainer: {
        height: '50%',
    },
    listContainer: {
        flex: 1,
        backgroundColor: colors.white,
    },
    headerRow: {
        flexDirection: 'row',
        padding: spacing.sm,
        backgroundColor: colors.gray6,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray4,
    },
    tableRow: {
        flexDirection: 'row',
        padding: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray4,
        minHeight: 40,
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: typography.small.fontSize,
    },
    tableCell: {
        fontSize: typography.small.fontSize,
    },
    nameCell: {
        flex: 2,
        paddingRight: spacing.sm,
    },
    categoryCell: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    addressCell: {
        flex: 2,
        paddingRight: spacing.sm,
    },
    distanceCell: {
        flex: 1,
        textAlign: 'right',
    },
    backButton: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        zIndex: 1,
    },
    categoryContainer: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.xxl,
        right: spacing.md,
        padding: spacing.sm,
        borderRadius: 8,
        zIndex: 1,
    },
    categoryText: {
        fontSize: typography.caption.fontSize,
        textAlign: 'center',
    },
    // Social Feature Styles
    listContent: {
        padding: spacing.md,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        marginBottom: spacing.sm,
        borderRadius: 12,
        elevation: 2,
    },
    avatar: {
        marginRight: spacing.md,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    itemEmail: {
        fontSize: typography.caption.fontSize,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyText: {
        fontSize: typography.h3.fontSize,
        fontWeight: '600',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: typography.caption.fontSize,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: spacing.md,
        bottom: spacing.md,
    },
    header: {
        padding: spacing.md,
        paddingBottom: spacing.sm,
    },
    title: {
        fontSize: typography.h2.fontSize,
        fontWeight: 'bold',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.caption.fontSize,
    },
    actions: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    chatButton: {
        marginBottom: spacing.sm,
    },
    removeButton: {
        borderColor: colors.danger,
    },
    infoSection: {
        padding: spacing.md,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    sectionContent: {
        fontSize: typography.body.fontSize,
    },
}); 