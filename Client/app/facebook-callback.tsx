import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';

/**
 * Facebook OAuth Callback Handler
 * This screen receives the authorization code and exchanges it for tokens
 * Called by: facebook.com/v18.0/dialog/oauth redirect
 */
export default function FacebookCallbackScreen() {
    const params = useGlobalSearchParams();

    useEffect(() => {
        console.log("=== FACEBOOK CALLBACK SCREEN ===");
        console.log("Route params:", params);

        // The authorization code should be in the URL parameters
        // Deep link format: com.laisvalaikio.app://facebook-callback?code=AUTHORIZATION_CODE
        // Expo Go format: exp://YOUR_IP:19000/--/facebook-callback?code=AUTHORIZATION_CODE

        // WebBrowser.openAuthSessionAsync handles the redirect automatically
        // This screen might not be called in normal flow, but kept as fallback
        
        router.back();
    }, [params]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={{ marginTop: 20, fontSize: 16 }}>Processing Facebook login...</Text>
        </View>
    );
}
