import { StyleSheet } from 'react-native';

export const registerScreenStyles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    surface: {
        width: "25%",
        minWidth: 300,
        maxWidth: 400,
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    title: {
        marginBottom: 20,
        textAlign: "center",
    },
    input: {
        width: "100%",
        marginBottom: 10,
    },
    button: {
        width: "100%",
        marginTop: 10,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    errorText: {
        textAlign: "center",
        marginBottom: 16,
    },
    loginLink: {
        marginTop: 20,
    },
    loginText: {
        textAlign: "center",
    },
    passwordContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    },
    passwordInput: {
        flex: 1,
        marginRight: 10,
    },
    passwordToggle: {
        position: "absolute",
        right: 10,
    },
}); 