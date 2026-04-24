import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface OAuthButtonsProps {
    firstName?: string;
    lastName?: string;
    theme?: string;
    onSuccess?: (user: any, token: string) => void;
    onError?: (error: Error) => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
    firstName,
    lastName,
    theme = 'light',
    onSuccess,
    onError
}) => {
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingFacebook, setLoadingFacebook] = useState(false);
    const [loadingMicrosoft, setLoadingMicrosoft] = useState(false);
    const { oauthLogin } = useAuth();
    const { t } = useTranslation();

    const handleGoogleLogin = async () => {
        try {
            setLoadingGoogle(true);
            const result = await authApi.googleLogin(firstName, lastName, theme);
            
            // Update auth context with OAuth login
            await oauthLogin('Google');
            
            onSuccess?.(result.user, result.token);
        } catch (error: any) {
            console.error('Google login error:', error);
            onError?.(error);
            Alert.alert(
                t('auth.login.googleLoginFailed'),
                error.message || t('auth.login.googleLoginError')
            );
        } finally {
            setLoadingGoogle(false);
        }
    };

    const handleFacebookLogin = async () => {
        try {
            setLoadingFacebook(true);
            const result = await authApi.facebookLogin(firstName, lastName, theme);
            
            // Update auth context with OAuth login
            await oauthLogin('Facebook');
            
            onSuccess?.(result.user, result.token);
        } catch (error: any) {
            console.error('Facebook login error:', error);
            onError?.(error);
            Alert.alert(
                t('auth.login.facebookLoginFailed'),
                error.message || t('auth.login.facebookLoginError')
            );
        } finally {
            setLoadingFacebook(false);
        }
    };

    const handleMicrosoftLogin = async () => {
        try {
            setLoadingMicrosoft(true);
            const result = await authApi.microsoftLogin(firstName, lastName, theme);

            // Update auth context with OAuth login
            await oauthLogin('Microsoft');

            onSuccess?.(result.user, result.token);
        } catch (error: any) {
            console.error('Microsoft login error:', error);
            onError?.(error);
            Alert.alert(
                t('auth.login.microsoftLoginFailed'),
                error.message || t('auth.login.microsoftLoginError')
            );
        } finally {
            setLoadingMicrosoft(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.divider} />
            
            <Button
                mode="outlined"
                onPress={handleGoogleLogin}
                disabled={loadingGoogle || loadingFacebook || loadingMicrosoft}
                loading={loadingGoogle}
                style={styles.button}
                icon="google"
            >
                {loadingGoogle ? t('auth.login.connectingGoogle') : t('auth.login.loginWithGoogle')}
            </Button>

            <Button
                mode="outlined"
                onPress={handleFacebookLogin}
                disabled={loadingGoogle || loadingFacebook || loadingMicrosoft}
                loading={loadingFacebook}
                style={styles.button}
                icon="facebook"
            >
                {loadingFacebook ? t('auth.login.connectingFacebook') : t('auth.login.loginWithFacebook')}
            </Button>

            <Button
                mode="outlined"
                onPress={handleMicrosoftLogin}
                disabled={loadingGoogle || loadingFacebook || loadingMicrosoft}
                loading={loadingMicrosoft}
                style={styles.button}
                icon="microsoft-windows"
            >
                {loadingMicrosoft ? t('auth.login.connectingMicrosoft') : t('auth.login.loginWithMicrosoft')}
            </Button>

            {(loadingGoogle || loadingFacebook || loadingMicrosoft) && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#0000ff" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
        gap: 12
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginBottom: 20
    },
    button: {
        borderRadius: 8,
        paddingVertical: 8
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 10
    }
});