import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';

/**
 * Google OAuth Callback Handler
 * This screen receives the authorization code and exchanges it for tokens
 * Called by: google.com/o/oauth2/v2/auth redirect
 */
export default function GoogleCallbackScreen() {
    const params = useGlobalSearchParams();

    useEffect(() => {
        console.log("=== GOOGLE CALLBACK SCREEN ===");
        console.log("Route params:", params);

        // The authorization code should be in the URL parameters
        // Deep link format: com.laisvalaikio.app://google-callback?code=AUTHORIZATION_CODE
        // Expo Go format: exp://YOUR_IP:19000/--/google-callback?code=AUTHORIZATION_CODE

        // WebBrowser.openAuthSessionAsync handles the redirect automatically
        // This screen might not be called in normal flow, but kept as fallback
        
        router.back();
    }, [params]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={{ marginTop: 20, fontSize: 16 }}>Processing Google login...</Text>
        </View>
    );
}
