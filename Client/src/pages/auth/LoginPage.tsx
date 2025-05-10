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
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { showToast } from "@/src/components/Toast";
import { useTranslation } from "react-i18next";
import OAuthWebHandler from "@/src/components/OAuthWebHandler";
import OAuthMobileHandler from "@/src/components/OAuthMobileHandler";
import { globalStyles, colors, spacing } from "@/src/styles/globalStyles";
import { useTheme } from "@/src/context/ThemeContext";
export default function LoginPage() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
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

    const handleLogin = async () => {
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
            style={[globalStyles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    padding: spacing.lg,
                }}
                keyboardShouldPersistTaps="handled"
            >
                <Surface
                    style={[
                        globalStyles.card,
                        {
                            backgroundColor: theme.colors.surface,
                            padding: spacing.xl,
                            borderRadius: 12,
                        }
                    ]}
                    elevation={4}
                >
                    <Text
                        variant="headlineLarge"
                        style={{
                            color: theme.colors.onSurface,
                            marginBottom: spacing.xl,
                            textAlign: 'center',
                        }}
                    >
                        {t("auth.login.title")}
                    </Text>

                    <TextInput
                        mode="outlined"
                        label={t("auth.login.email")}
                        value={email}
                        onChangeText={handleEmailChange}
                        style={{ marginBottom: spacing.md }}
                        outlineStyle={{ borderRadius: 8 }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        autoCorrect={false}
                        left={<TextInput.Icon icon="email" />}
                        right={
                            <TextInput.Icon
                                icon={isEmailValid ? "check" : "close"}
                                color={isEmailValid ? colors.success : colors.danger}
                            />
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label={t("auth.login.password")}
                        value={password}
                        onChangeText={setPassword}
                        textContentType="password"
                        autoCapitalize="none"
                        autoComplete="password"
                        secureTextEntry={!isPasswordVisible}
                        style={{ marginBottom: spacing.xs }}
                        outlineStyle={{ borderRadius: 8 }}
                        left={<TextInput.Icon icon="lock" />}
                        right={
                            <TextInput.Icon
                                icon={isPasswordVisible ? "eye-off" : "eye"}
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            />
                        }
                    />

                    <TouchableOpacity
                        onPress={() => { }}
                        style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}
                    >
                        <Text style={{
                            color: theme.colors.primary,
                            fontSize: 14,
                        }}>
                            {t("auth.login.forgotPassword")}
                        </Text>
                    </TouchableOpacity>

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={!isEmailValid || !password}
                        style={[
                            globalStyles.button,
                            {
                                backgroundColor: theme.colors.primary,
                                marginTop: spacing.lg,
                            }
                        ]}
                    >
                        {t("auth.login.submit")}
                    </Button>

                    <TouchableOpacity
                        onPress={() => router.push("/(auth)/register")}
                        style={{ marginTop: spacing.lg }}
                    >
                        <Text style={{
                            color: theme.colors.onSurface,
                            textAlign: 'center',
                            opacity: 0.8,
                        }}>
                            {t("auth.login.noAccount")} {t("auth.login.signUp")}
                        </Text>
                    </TouchableOpacity>
                </Surface>
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