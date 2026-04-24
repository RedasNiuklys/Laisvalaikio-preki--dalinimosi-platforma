import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';

/**
 * Microsoft OAuth Callback Handler
 * This screen receives the authorization code and exchanges it for tokens
 * Called by: login.microsoftonline.com redirect
 */
export default function MicrosoftCallbackScreen() {
    const params = useGlobalSearchParams();

    useEffect(() => {
        console.log("=== MICROSOFT CALLBACK SCREEN ===");
        console.log("Route params:", params);

        // WebBrowser.openAuthSessionAsync handles the redirect automatically
        // This screen might not be called in normal flow, but kept as fallback
        try {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        } catch (error) {
            console.warn('Microsoft callback navigation fallback:', error);
            router.replace('/');
        }
    }, [params]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={{ marginTop: 20, fontSize: 16 }}>Processing Microsoft login...</Text>
        </View>
    );
}
