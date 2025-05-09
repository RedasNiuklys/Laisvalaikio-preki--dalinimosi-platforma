import { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../components/Toast";
import { useTranslation } from "react-i18next";
import { registerScreenStyles } from "../styles/RegisterScreen.styles";
const RegisterScreen = () => {
  const theme = usePaperTheme();
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);

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

  const handleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(true);
  };

  const handleConfirmPasswordVisibilityRelease = () => {
    setIsConfirmPasswordVisible(false);
  };

  const handleRegister = async () => {
    setError(null);

    if (!isEmailValid) {
      showToast("error", "Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      showToast(
        "error",
        "Password must be at least 8 characters long and contain a number and a special character"
      );
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password);
      showToast("success", "Registration successful!");
      // @ts-ignore - Navigation type issue
      navigation.navigate("Home");
    } catch (err) {
      showToast("error", "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={registerScreenStyles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={registerScreenStyles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            registerScreenStyles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Surface style={registerScreenStyles.surface} elevation={4}>
            <Text
              variant="headlineMedium"
              style={[
                registerScreenStyles.title,
                { color: theme.colors.onSurface },
              ]}
            >
              {t("auth.register.title")}
            </Text>

            {error && (
              <Text
                style={[
                  registerScreenStyles.errorText,
                  { color: theme.colors.error },
                ]}
              >
                {error}
              </Text>
            )}

            <TextInput
              mode="outlined"
              label={t("auth.register.email")}
              value={email}
              onChangeText={handleEmailChange}
              style={registerScreenStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              accessibilityRole="text"
              accessibilityLabel={t("auth.register.email")}
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
              label={t("auth.register.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              style={registerScreenStyles.input}
              returnKeyType="done"
              autoComplete="password"
              accessibilityRole="text"
              accessibilityLabel={t("auth.register.password")}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={isPasswordVisible ? "eye-off" : "eye"}
                  onPressIn={handlePasswordVisibility}
                  onPressOut={handlePasswordVisibilityRelease}
                />
              }
            />
            <HelperText type="info" visible={true}>
              Password must be at least 8 characters with a number and a special
              character
            </HelperText>

            <TextInput
              mode="outlined"
              label={t("auth.register.confirmPassword")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmPasswordVisible}
              style={registerScreenStyles.input}
              returnKeyType="done"
              autoComplete="password"
              accessibilityRole="text"
              accessibilityLabel={t("auth.register.confirmPassword")}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={isConfirmPasswordVisible ? "eye-off" : "eye"}
                  onPressIn={handleConfirmPasswordVisibility}
                  onPressOut={handleConfirmPasswordVisibilityRelease}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={!isEmailValid || !password || !confirmPassword}
              style={registerScreenStyles.button}
            >
              {t("auth.register.submit")}
            </Button>

            <TouchableOpacity
              onPress={() => {
                // @ts-ignore - Navigation type issue
                navigation.navigate("Login");
              }}
              style={registerScreenStyles.loginLink}
            >
              <Text
                style={[
                  registerScreenStyles.loginText,
                  { color: theme.colors.onSurface },
                ]}
              >
                {t("auth.register.haveAccount")} {t("auth.register.signIn")}
              </Text>
            </TouchableOpacity>
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
