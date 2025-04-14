import React, { useState } from "react";
import { View, TextInput, Button, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext"; // Import your auth context to handle login logic
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../theme/styles";

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useTheme();
  const { login } = useAuth(); // Get login function from AuthContext

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const handlePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleLogin = async () => {
    try {
      // Perform login logic (use react-native-app-auth or other methods)
      await login(email, password); // Assuming login function is in your AuthContext
    } catch (err) {
      setError("Login failed");
    }
  };
  const handleOAuthLogin = async (provider: string) => {
    try {
      // Use OAuth login based on the provider
      await login(email, password,provider); // Adjust this logic in AuthContext to handle OAuth login
    } catch (error) {
      setError("Something went wrong with OAuth login.");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundColor }}>
      <Text style={{ color: theme.primaryTextColor, fontSize: 24 }}>Login</Text>
      {error && <Text style={{ color: theme.errorColor }}>{error}</Text>}
      <TextInput
        style={{ backgroundColor: theme.ctaButtonColor, padding: 10, marginTop: 20, width: "80%" }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
<View style={{ position: "relative" }}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
          style={{
            height: 40,
            borderColor: "gray",
            borderWidth: 1,
            marginBottom: 20,
            paddingLeft: 10,
          }}
        />
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            zIndex: 1,
          }}
          onPressIn={handlePasswordVisibility}
          onPressOut={handlePasswordVisibility}
               >
          <Ionicons
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <Button title="Login" onPress={handleLogin} />
      <Button title="Go to Register" onPress={() => navigation.navigate("Register")} />
        
      <Text style={styles.orText}>OR</Text>

OAuth Buttons
<View style={styles.oAuthButtons}>
  <TouchableOpacity
    style={styles.oAuthButton}
    onPress={() => handleOAuthLogin('Google')}
  >
    <Ionicons name="logo-google" size={24} color="white" />
    <Text style={styles.oAuthButtonText}>Login with Google</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.oAuthButton}
    onPress={() => handleOAuthLogin('Facebook')}
  >
    <Ionicons name="logo-facebook" size={24} color="white" />
    <Text style={styles.oAuthButtonText}>Login with Facebook</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.oAuthButton}
    onPress={() => handleOAuthLogin('Apple')}
  >
    <Ionicons name="logo-apple" size={24} color="white" />
    <Text style={styles.oAuthButtonText}>Login with Apple</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.oAuthButton}
    onPress={() => handleOAuthLogin('Microsoft')}
  >
    <Ionicons name="logo-windows" size={24} color="white" />
    <Text style={styles.oAuthButtonText}>Login with Microsoft</Text>
  </TouchableOpacity>
</View>

<TouchableOpacity onPress={() => navigation.navigate("Register")}>
  <Text style={styles.registerText}>Don't have an account? Register here</Text>
</TouchableOpacity>
    </View>

  );
};
export default LoginScreen;
