import { StyleSheet } from 'react-native';

export const buttonStyles = StyleSheet.create({
    buttonContainer: {
        width: '100%',
        borderRadius: 8,
        height: 48,
        marginHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    },
    button: {
        borderRadius: 8,
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonIcon: {
        paddingRight: 8,
    },
    buttonLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.5,
    },
    smallButton: {
        height: 36,
    },
    smallButtonLabel: {
        fontSize: 14,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    outlineButtonLabel: {
        color: '#FFFFFF',
    },
    textButton: {
        backgroundColor: 'transparent',
    },
    textButtonLabel: {
        color: '#FFFFFF',
    },
}); 