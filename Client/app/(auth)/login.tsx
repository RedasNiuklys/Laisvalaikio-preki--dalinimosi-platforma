import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
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
  HelperText,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { loginScreenStyles } from "@/src/styles/LoginScreen.styles";
import { showToast } from "@/src/components/Toast";
import { useTranslation } from "react-i18next";
import OAuthWebHandler from "@/src/components/OAuthWebHandler";
import OAuthMobileHandler from "@/src/components/OAuthMobileHandler";

export default function LoginScreen() {
  const theme = usePaperTheme();
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  const [showOAuth, setShowOAuth] = useState<boolean>(false);
  const [currentProvider, setCurrentProvider] = useState<string>("Google");

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

  const handleLogin = async () => {
    setError(null);

    if (!isEmailValid) {
      showToast("error", t("auth.login.invalidEmail"));
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      showToast("success", t("auth.login.success"));
      router.replace("/");
    } catch (err) {
      showToast("error", t("auth.login.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSuccess = (token: string) => {
    setShowOAuth(false);
    router.replace("/");
  };

  const handleOAuthError = (error: string) => {
    showToast("error", error);
    setShowOAuth(false);
  };

  return (
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
                loginScreenStyles.title,
                { color: theme.colors.onSurface },
              ]}
            >
              {t("auth.login.title")}
            </Text>

            <TextInput
              mode="outlined"
              label={t("auth.login.email")}
              value={email}
              onChangeText={handleEmailChange}
              style={loginScreenStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
              right={
                <TextInput.Icon
                  icon={isEmailValid ? "check" : "close"}
                  color={
                    isEmailValid ? theme.colors.primary : theme.colors.error
                  }
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
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={isPasswordVisible ? "eye-off" : "eye"}
                  onPressIn={handlePasswordVisibility}
                  onPressOut={handlePasswordVisibilityRelease}
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

            <Button
              mode="outlined"
              onPress={() => {
                setCurrentProvider("Google");
                setShowOAuth(true);
              }}
              style={loginScreenStyles.button}
            >
              {t("auth.login.oauth")}
            </Button>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              style={loginScreenStyles.registerLink}
            >
              <Text
                style={[
                  loginScreenStyles.registerText,
                  { color: theme.colors.onSurface },
                ]}
              >
                {t("auth.login.noAccount")} {t("auth.login.signUp")}
              </Text>
            </TouchableOpacity>
          </Surface>
        </View>
      </ScrollView>

      {Platform.OS === "web" ? (
        <OAuthWebHandler
          provider={currentProvider}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />
      ) : (
        <OAuthMobileHandler
          provider={currentProvider}
          visible={showOAuth}
          onClose={() => setShowOAuth(false)}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />
      )}
    </KeyboardAvoidingView>
  );
}
