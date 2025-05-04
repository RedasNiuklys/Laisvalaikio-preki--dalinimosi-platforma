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
import { styles } from "../styles/RegisterScreen.styles";
import { showToast } from "../components/Toast";

const RegisterScreen = () => {
  const theme = usePaperTheme();
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
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Surface style={styles.surface} elevation={4}>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Create Account
            </Text>

            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}

            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              style={styles.input}
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
              style={styles.input}
              autoComplete="password"
              accessibilityRole="text"
              accessibilityLabel="Password input"
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
            <HelperText type="info" visible={true}>
              Password must be at least 8 characters with a number and a special
              character
            </HelperText>

            <TextInput
              mode="outlined"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmPasswordVisible}
              style={styles.input}
              autoComplete="password"
              accessibilityRole="text"
              accessibilityLabel="Confirm password input"
              left={<TextInput.Icon icon="lock-check" tabIndex={-1} />}
              right={
                <TextInput.Icon
                  icon={isConfirmPasswordVisible ? "eye-off" : "eye"}
                  onPressIn={handleConfirmPasswordVisibility}
                  onPressOut={handleConfirmPasswordVisibilityRelease}
                  tabIndex={-1}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="account-plus"
              loading={isLoading}
              disabled={isLoading}
            >
              Register
            </Button>

            <TouchableOpacity
              onPress={() => {
                // @ts-ignore - Navigation type issue
                navigation.navigate("Login");
              }}
              style={styles.loginLink}
            >
              <Text
                style={[styles.loginText, { color: theme.colors.onSurface }]}
              >
                Already have an account?{" "}
                <Text style={{ color: theme.colors.primary }}>Login here</Text>
              </Text>
            </TouchableOpacity>
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
