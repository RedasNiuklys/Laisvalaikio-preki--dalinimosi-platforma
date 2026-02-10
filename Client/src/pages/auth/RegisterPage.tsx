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
import { globalStyles, colors, spacing } from "@/src/styles/globalStyles";

export default function RegisterPage() {
    const theme = usePaperTheme();
    const { t } = useTranslation();
    const { register } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
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

    const handleRegister = async () => {
        if (!isEmailValid) {
            showToast("error", t("auth.register.invalidEmail"));
            return;
        }

        if (password !== confirmPassword) {
            showToast("error", t("auth.register.passwordsDoNotMatch"));
            return;
        }

        try {
            setIsLoading(true);
            await register(
                email,
                password,
                firstName || undefined,
                lastName || undefined,
                theme.dark ? "dark" : "light"
            );
            showToast("success", t("auth.register.success"));
            router.replace("/");
        } catch (err) {
            showToast("error", t("auth.register.error"));
        } finally {
            setIsLoading(false);
        }
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
                        {t("auth.register.title")}
                    </Text>

                    <TextInput
                        mode="outlined"
                        label={t("auth.register.firstName")}
                        value={firstName}
                        onChangeText={setFirstName}
                        style={{ marginBottom: spacing.md }}
                        outlineStyle={{ borderRadius: 8 }}
                        left={<TextInput.Icon icon="account" pointerEvents="none" tabIndex={-1} />}
                    />

                    <TextInput
                        mode="outlined"
                        label={t("auth.register.lastName")}
                        value={lastName}
                        onChangeText={setLastName}
                        style={{ marginBottom: spacing.md }}
                        outlineStyle={{ borderRadius: 8 }}
                        left={<TextInput.Icon icon="account" pointerEvents="none" tabIndex={-1} />}
                    />

                    <TextInput
                        mode="outlined"
                        label={t("auth.register.email")}
                        value={email}
                        onChangeText={handleEmailChange}
                        style={{ marginBottom: spacing.md }}
                        // contentStyle={{ backgroundColor: theme.colors.surface }}
                        outlineStyle={{ borderRadius: 8 }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        left={<TextInput.Icon icon="email" pointerEvents="none" tabIndex={-1} />}
                        right={
                            <TextInput.Icon
                                icon={isEmailValid ? "check" : "close"}
                                color={isEmailValid ? colors.success : colors.danger}
                                pointerEvents="none"
                                tabIndex={-1}
                            />
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label={t("auth.register.password")}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        style={{ marginBottom: spacing.md }}
                        outlineStyle={{ borderRadius: 8 }}
                        left={<TextInput.Icon icon="lock" pointerEvents="none" tabIndex={-1} />}
                        right={
                            <TextInput.Icon
                                icon={isPasswordVisible ? "eye-off" : "eye"}
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                accessible={false}
                                tabIndex={-1}
                            />
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label={t("auth.register.confirmPassword")}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!isPasswordVisible}
                        style={{ marginBottom: spacing.md }}
                        outlineStyle={{ borderRadius: 8 }}
                        left={<TextInput.Icon icon="lock-check" pointerEvents="none" tabIndex={-1} />}
                        right={
                            <TextInput.Icon
                                icon={isPasswordVisible ? "eye-off" : "eye"}
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                accessible={false}
                                tabIndex={-1}
                            />
                        }
                    />

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={isLoading}
                        disabled={!isEmailValid || !password || !confirmPassword}
                        style={[
                            globalStyles.button,
                            {
                                backgroundColor: theme.colors.primary,
                                marginTop: spacing.lg,
                            }
                        ]}
                    >
                        {t("auth.register.submit")}
                    </Button>

                    <TouchableOpacity
                        onPress={() => router.push("/(auth)/login")}
                        style={{ marginTop: spacing.lg }}
                    >
                        <Text style={{
                            color: theme.colors.onSurface,
                            textAlign: 'center',
                            opacity: 0.8,
                        }}>
                            {t("auth.register.haveAccount")} {t("auth.register.signIn")}
                        </Text>
                    </TouchableOpacity>
                </Surface>
            </ScrollView>
        </KeyboardAvoidingView>
    );
} 