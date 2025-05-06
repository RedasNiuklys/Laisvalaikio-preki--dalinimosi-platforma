import React, { useState } from "react";
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
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OAuthWebHandler from "../components/OAuthWebHandler";
import OAuthMobileHandler from "../components/OAuthMobileHandler";
import { loginScreenStyles } from "../styles/LoginScreen.styles";
import { showToast } from "../components/Toast";
import { useTranslation } from "react-i18next";

const LoginScreen = () => {
  const theme = usePaperTheme();
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      showToast("error", "Failed to save authentication token");
    }
  };

  const handleOAuthError = (error: string) => {
    showToast("error", error);
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      setError(null);
      setCurrentProvider(provider);
      setShowOAuthModal(true);
    } catch (error) {
      console.error("OAuth login error:", error);
      showToast("error", `Failed to start ${provider} login`);
    }
  };

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      showToast("error", "Please fill in all fields");
      return;
    }

    if (!isEmailValid) {
      showToast("error", "Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      //console.log
      ("Login started");
      await login(email, password);
      showToast("success", "Login successful!");
      // @ts-ignore - Navigation type issue
      navigation.navigate("Home");
    } catch (err: any) {
      // Only show the error toast if it's a specific error message from the server
      if (err.response?.data?.message) {
        showToast("error", err.response.data.message);
      } else {
        showToast("error", "Invalid email or password");
      }
    } finally {
      setIsLoading(false);
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
                {t("auth.login.title")}
              </Text>
              <Text
                variant="headlineMedium"
                style={[
                  loginScreenStyles.title,
                  { color: theme.colors.onSurface },
                ]}
              >
                {t("auth.login.welcomeBack")}
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
                label={t("auth.login.email")}
                value={email}
                onChangeText={handleEmailChange}
                style={loginScreenStyles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus
                accessibilityRole="text"
                accessibilityLabel={t("auth.login.email")}
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
                label={t("auth.login.password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                style={loginScreenStyles.input}
                returnKeyType="done"
                autoComplete="password"
                accessibilityRole="text"
                accessibilityLabel={t("auth.login.password")}
                left={<TextInput.Icon icon="lock" tabIndex={-1} />}
                right={
                  <TextInput.Icon
                    icon={isPasswordVisible ? "eye-off" : "eye"}
                    onPressIn={handlePasswordVisibility}
                    onPressOut={handlePasswordVisibilityRelease}
                    tabIndex={-1}
                  />
                }
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={!isEmailValid || !password}
                style={loginScreenStyles.button}
              >
                {t("auth.login.submit")}
              </Button>

              <View style={loginScreenStyles.dividerContainer}>
                <Divider style={loginScreenStyles.divider} />
                <Text style={loginScreenStyles.orText}>OR</Text>
                <Divider style={loginScreenStyles.divider} />
              </View>

              <Text style={loginScreenStyles.socialLoginText}>
                {t("auth.login.logInWith")}
              </Text>

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
                  {t("auth.login.noAccount")}
                  <Text style={{ color: theme.colors.primary }}>
                    {t("auth.login.signUp")}
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
    </>
  );
};

export default LoginScreen;
