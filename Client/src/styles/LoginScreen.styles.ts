import { StyleSheet } from 'react-native';

export const loginScreenStyles = StyleSheet.create({
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
    socialButtonsContainer: {
        width: "100%",
        maxWidth: 300,
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    divider: {
        flex: 1,
        height: 1,
    },
    socialButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        borderRadius: 5,
        width: "48%",
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
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flexGrow: 1,
    },
    pageHeader: {
        marginBottom: 20,
        fontWeight: "bold",
    },
    title: {
        marginBottom: 20,
        textAlign: "center",
    },
    errorText: {
        color: "red",
        marginBottom: 10,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginVertical: 20,
    },
    orText: {
        marginHorizontal: 10,
        fontWeight: "bold",
    },
    socialLoginText: {
        marginTop: 20,
        marginBottom: 10,
    },
    socialButtonText: {
        color: "white",
        marginLeft: 10,
    },
    registerLink: {
        marginTop: 20,
    },
    registerText: {
        textAlign: "center",
    },
}); 