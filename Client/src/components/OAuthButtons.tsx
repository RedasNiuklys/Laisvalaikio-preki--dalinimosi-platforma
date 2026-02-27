import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

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
    const { oauthLogin } = useAuth();

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
                'Google Login Failed',
                error.message || 'An unexpected error occurred'
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
                'Facebook Login Failed',
                error.message || 'An unexpected error occurred'
            );
        } finally {
            setLoadingFacebook(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.divider} />
            
            <Button
                mode="outlined"
                onPress={handleGoogleLogin}
                disabled={loadingGoogle || loadingFacebook}
                loading={loadingGoogle}
                style={styles.button}
                icon="google"
            >
                {loadingGoogle ? 'Connecting...' : 'Login with Google'}
            </Button>

            <Button
                mode="outlined"
                onPress={handleFacebookLogin}
                disabled={loadingGoogle || loadingFacebook}
                loading={loadingFacebook}
                style={styles.button}
                icon="facebook"
            >
                {loadingFacebook ? 'Connecting...' : 'Login with Facebook'}
            </Button>

            {(loadingGoogle || loadingFacebook) && (
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