import React, { useState } from "react";
import {
    View,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    Alert,
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
import axios from "axios";
import { FIREBASE_REST_API, firebaseConfig } from "@/src/config/firebaseConfig";
import { OAuthButtons } from "@/src/components/OAuthButtons";
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
    const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");
    const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState<boolean>(false);
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
            router.replace("/(tabs)");
        } catch (err) {
            showToast("error", t("auth.login.error"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSuccess = (token: string) => {
        setShowOAuth(false);
        router.replace("/(tabs)");
    };

    const handleOAuthError = (error: string) => {
        showToast("error", error);
        setShowOAuth(false);
    };

    const handleForgotPassword = async () => {
        if (!forgotPasswordEmail.trim()) {
            showToast("error", t("auth.login.enterEmail"));
            return
        }

        try {
            setIsForgotPasswordLoading(true);
            await axios.post(
                `${FIREBASE_REST_API.base}:sendOobCode?key=${firebaseConfig.apiKey}`,
                {
                    requestType: "PASSWORD_RESET",
                    email: forgotPasswordEmail,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            showToast("success", t("auth.login.resetEmailSent"));
            setShowForgotPassword(false);
            setForgotPasswordEmail("");
        } catch (err: any) {
            console.error("Password reset error:", err);
            if (err.response?.data?.error?.message?.includes("EMAIL_NOT_FOUND")) {
                showToast("error", t("auth.login.userNotFound"));
            } else if (err.response?.data?.error?.message?.includes("INVALID_EMAIL")) {
                showToast("error", t("auth.login.invalidEmail"));
            } else {
                showToast("error", t("auth.login.resetError"));
            }
        } finally {
            setIsForgotPasswordLoading(false);
        }
    };

    return (
        <>
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
                            left={<TextInput.Icon icon="email" 
                                                            pointerEvents="none"
                                                            tabIndex={-1}/>}
                            right={<TextInput.Icon
                                                            pointerEvents="none"
                                                            tabIndex={-1}
                                icon={isEmailValid ? "check" : "close"}
                                color={isEmailValid ? colors.success : colors.danger} />} />

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
                            left={<TextInput.Icon icon="lock" 
                                                            pointerEvents="none"
                                                            tabIndex={-1}/>}
                            right={<TextInput.Icon
                                icon={isPasswordVisible ? "eye-off" : "eye"}
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)} />} />

                        <TouchableOpacity
                            onPress={() => setShowForgotPassword(true)}
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
                        <OAuthButtons
                            onSuccess={(user, token) => {
                                console.log('User logged in:', user);
                                router.replace('/(tabs)');
                            } }
                            onError={(error) => {
                                Alert.alert('Login Failed', error.message);
                            } } />
                        {Platform.OS === "web" ? (
                            <OAuthWebHandler
                                provider={currentProvider}
                                onSuccess={handleOAuthSuccess}
                                onError={handleOAuthError} />
                        ) : (
                            <OAuthMobileHandler
                                provider={currentProvider}
                                visible={showOAuth}
                                onClose={() => setShowOAuth(false)}
                                onSuccess={handleOAuthSuccess}
                                onError={handleOAuthError} />
                        )}
                    </Surface>
                </ScrollView>
            </KeyboardAvoidingView><Modal
                visible={showForgotPassword}
                transparent
                animationType="slide"
                onRequestClose={() => setShowForgotPassword(false)}
            >
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
                                style={[{
                                    backgroundColor: theme.colors.surface,
                                    padding: spacing.xl,
                                    borderRadius: 12,
                                }]}
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
                                    {t("auth.login.resetPassword")}
                                </Text>

                                <Text
                                    variant="bodyMedium"
                                    style={{
                                        color: theme.colors.onSurface,
                                        marginBottom: spacing.lg,
                                        opacity: 0.7,
                                    }}
                                >
                                    {t("auth.login.resetDescription")}
                                </Text>

                                <TextInput
                                    mode="outlined"
                                    label={t("auth.login.email")}
                                    value={forgotPasswordEmail}
                                    onChangeText={setForgotPasswordEmail}
                                    style={{ marginBottom: spacing.md }}
                                    outlineStyle={{ borderRadius: 8 }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    textContentType="emailAddress"
                                    autoCorrect={false}
                                    left={<TextInput.Icon icon="email" />} />

                                <Button
                                    mode="contained"
                                    onPress={handleForgotPassword}
                                    loading={isForgotPasswordLoading}
                                    disabled={!forgotPasswordEmail.trim()}
                                    style={[{
                                        backgroundColor: theme.colors.primary,
                                        marginBottom: spacing.md,
                                    }]}
                                >
                                    {t("auth.login.sendReset")}
                                </Button>

                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setShowForgotPassword(false);
                                        setForgotPasswordEmail("");
                                    } }
                                    style={{
                                        borderColor: theme.colors.primary,
                                    }}
                                >
                                    {t("common.buttons.cancel")}
                                </Button>
                            </Surface>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Modal>
    </>
    )
}