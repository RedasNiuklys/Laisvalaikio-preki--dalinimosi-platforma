import { useState } from "react";
import {
  View,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Surface,
  useTheme as usePaperTheme,
  Divider,
  Snackbar,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OAuthWebHandler from "../components/OAuthWebHandler";
import OAuthMobileHandler from "../components/OAuthMobileHandler";
import { loginScreenStyles } from "../styles/LoginScreen.styles";

const LoginScreen = () => {
  const theme = usePaperTheme();
  const { login } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success"
  );
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string>("");

  // Handle deep linking for OAuth callbacks
  const handleDeepLink = async (event: { url: string }) => {
    const { url } = event;
    if (url.includes("token=")) {
      const token = url.split("token=")[1];
      await AsyncStorage.setItem("token", token);
      navigation.navigate("Home");
    }
  };

  // Add event listener for deep linking
  const subscription = Linking.addEventListener("url", handleDeepLink);

  // Check for initial URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink({ url });
    }
  });
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setIsEmailValid(validateEmail(text));
  };

  const handlePasswordVisibility = () => {
    setIsPasswordVisible(true);
  };

  const handlePasswordVisibilityRelease = () => {
    setIsPasswordVisible(false);
  };

  const handleOAuthSuccess = async (token: string) => {
    try {
      await AsyncStorage.setItem("token", token);
      navigation.navigate("Home");
    } catch (error) {
      console.error("Error saving token:", error);
      setSnackbarMessage("Failed to save authentication token");
      setSnackbarType("error");
      setSnackbarVisible(true);
    }
  };

  const handleOAuthError = (error: string) => {
    setSnackbarMessage(error);
    setSnackbarType("error");
    setSnackbarVisible(true);
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      setError(null);
      setCurrentProvider(provider);
      setShowOAuthModal(true);
    } catch (error) {
      console.error("OAuth login error:", error);
      setSnackbarMessage(`Failed to start ${provider} login`);
      setSnackbarType("error");
      setSnackbarVisible(true);
    }
  };

  const handleLogin = async () => {
    if (!isEmailValid) {
      setSnackbarMessage("Please enter a valid email address");
      setSnackbarType("error");
      setSnackbarVisible(true);
      return;
    }

    try {
      setError(null);
      await login(email, password);
      setSnackbarMessage("Login successful!");
      setSnackbarType("success");
      setSnackbarVisible(true);
      navigation.navigate("Home");
    } catch (err) {
      setSnackbarMessage("Login failed. Please check your credentials.");
      setSnackbarType("error");
      setSnackbarVisible(true);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={loginScreenStyles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={loginScreenStyles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              loginScreenStyles.container,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Surface style={loginScreenStyles.surface} elevation={4}>
              <Text
                variant="headlineLarge"
                style={[
                  loginScreenStyles.pageHeader,
                  { color: theme.colors.onSurface },
                ]}
              >
                Login
              </Text>
              <Text
                variant="headlineMedium"
                style={[
                  loginScreenStyles.title,
                  { color: theme.colors.onSurface },
                ]}
              >
                Welcome Back
              </Text>

              {error && (
                <Text
                  style={[
                    loginScreenStyles.errorText,
                    { color: theme.colors.error },
                  ]}
                >
                  {error}
                </Text>
              )}

              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={handleEmailChange}
                style={loginScreenStyles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus
                accessibilityRole="text"
                accessibilityLabel="Email input"
                tabIndex={-1}
                left={<TextInput.Icon icon="email" tabIndex={-1} />}
                right={
                  <TextInput.Icon
                    icon={isEmailValid ? "check" : "close"}
                    color={
                      isEmailValid ? theme.colors.primary : theme.colors.error
                    }
                    tabIndex={-1}
                  />
                }
              />

              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                style={loginScreenStyles.input}
                returnKeyType="done"
                autoComplete="password"
                accessibilityRole="text"
                accessibilityLabel="Password input"
                right={
                  <TextInput.Icon
                    icon={isPasswordVisible ? "eye-off" : "eye"}
                    onPressIn={handlePasswordVisibility}
                    onPressOut={handlePasswordVisibilityRelease}
                  />
                }
                left={<TextInput.Icon icon="lock" tabIndex={-1} />}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                style={loginScreenStyles.button}
                contentStyle={loginScreenStyles.buttonContent}
                icon="login"
              >
                Login
              </Button>

              <View style={loginScreenStyles.dividerContainer}>
                <Divider style={loginScreenStyles.divider} />
                <Text style={loginScreenStyles.orText}>OR</Text>
                <Divider style={loginScreenStyles.divider} />
              </View>

              <Text style={loginScreenStyles.socialLoginText}>Log in with</Text>

              <View style={loginScreenStyles.socialButtonsContainer}>
                <TouchableOpacity
                  style={[
                    loginScreenStyles.socialButton,
                    { backgroundColor: "#DB4437" },
                  ]}
                  onPress={() => handleOAuthLogin("Google")}
                >
                  <Ionicons name="logo-google" size={24} color="white" />
                  <Text style={loginScreenStyles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    loginScreenStyles.socialButton,
                    { backgroundColor: "#4267B2" },
                  ]}
                  onPress={() => handleOAuthLogin("Facebook")}
                >
                  <Ionicons name="logo-facebook" size={24} color="white" />
                  <Text style={loginScreenStyles.socialButtonText}>
                    Facebook
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                style={loginScreenStyles.registerLink}
              >
                <Text
                  style={[
                    loginScreenStyles.registerText,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  Don't have an account?{" "}
                  <Text style={{ color: theme.colors.primary }}>
                    Register here
                  </Text>
                </Text>
              </TouchableOpacity>
            </Surface>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === "web" ? (
        <OAuthWebHandler
          provider={currentProvider}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />
      ) : (
        <OAuthMobileHandler
          provider={currentProvider}
          visible={showOAuthModal}
          onClose={() => setShowOAuthModal(false)}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{
          backgroundColor:
            snackbarType === "success"
              ? theme.colors.secondary
              : theme.colors.error,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

export default LoginScreen;
