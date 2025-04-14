import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  container: {
    flex: 2,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f7f7f7",
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 30,
    },
    input: {
      height: 40,
      borderColor: "#ccc",
      borderWidth: 1,
      marginBottom: 15,
      paddingLeft: 10,
      borderRadius: 5,
    },
    errorText: {
      color: "red",
      textAlign: "center",
      marginBottom: 15,
    },
    orText: {
      textAlign: "center",
      marginVertical: 10,
      fontSize: 16,
      color: "#888",
    },
    oAuthButtons: {
      marginTop: 20,
    },
    oAuthButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#333",
      padding: 15,
      marginBottom: 10,
      borderRadius: 5,
      justifyContent: "center",
    },
    oAuthButtonText: {
      marginLeft: 10,
      color: "white",
      fontSize: 16,
    },
    registerText: {
      textAlign: "center",
      marginTop: 15,
      color: "#007bff",
    },
  })