import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OAUTH_CONFIG } from './firebaseConfig';
import { Platform } from 'react-native';

// Keep browser session active
WebBrowser.maybeCompleteAuthSession();

/**
 * Server-side Google OAuth Flow
 * 1. Opens browser with Google OAuth consent screen (redirect to server)
 * 2. User logs in and authorizes
 * 3. Server receives callback, authenticates user, generates JWT
 * 4. Server redirects to laisvalaikio://oauth-callback?token=xxx (mobile) or sends postMessage (web)
 * 5. Extract token from URL/message and store it
 * 
 * Note: For private IP testing, Google requires device_id and device_name
 */
export const handleGoogleOAuthServer = async () => {
    try {
        console.log("🔐 === SERVER-SIDE GOOGLE OAUTH START ===");

        // Step 1: Build Google OAuth consent URL (points to server callback)
        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleAuthUrl.searchParams.set("client_id", OAUTH_CONFIG.google.clientId);
        googleAuthUrl.searchParams.set("redirect_uri", OAUTH_CONFIG.google.redirectUrl);
        googleAuthUrl.searchParams.set("response_type", "code");
        googleAuthUrl.searchParams.set("scope", "openid email profile");
        googleAuthUrl.searchParams.set("access_type", "offline");
        if (Platform.OS === 'web') {
            googleAuthUrl.searchParams.set("state", "web");
        }
        // Required only for private-IP/local callback hosts
        const callbackHost = new URL(OAUTH_CONFIG.google.redirectUrl).hostname;
        const isPrivateHost = callbackHost === 'localhost'
            || callbackHost === '127.0.0.1'
            || callbackHost.startsWith('10.')
            || callbackHost.startsWith('192.168.')
            || /^172\.(1[6-9]|2\d|3[0-1])\./.test(callbackHost);

        if (Platform.OS !== 'web' && isPrivateHost) {
            googleAuthUrl.searchParams.set("device_id", "laisvalaikio-app-1");
            googleAuthUrl.searchParams.set("device_name", "Laisvalaikio Platform");
        }

        console.log("🌐 Opening Google auth URL:", googleAuthUrl.toString());
        console.log("📍 Redirect URI (server):", OAUTH_CONFIG.google.redirectUrl);

        // Web uses postMessage, native uses deep links
        if (Platform.OS === 'web') {
            return await handleOAuthWeb(googleAuthUrl.toString(), 'google');
        }

        // Step 2: Open browser - server will handle OAuth and redirect back
        const result = await WebBrowser.openAuthSessionAsync(
            googleAuthUrl.toString(), 
            "laisvalaikio://oauth-callback"  // Our app's deep link for receiving token
        );

        console.log("📱 Browser result:", result.type);

        if (result.type === "cancel") {
            throw new Error("User cancelled Google login");
        }

        if (result.type !== "success") {
            throw new Error(`OAuth failed: ${result.type}`);
        }

        // Step 3: Extract JWT token from URL (server sent it via redirect)
        const resultUrl = result.url;
        console.log("🔗 Result URL:", resultUrl);

        const url = new URL(resultUrl);
        const token = url.searchParams.get("token");
        const isNewUser = url.searchParams.get("isNewUser") === "true";
        const provider = url.searchParams.get("provider");
        const facebookAccessToken = url.searchParams.get("facebookAccessToken");

        if (!token) {
            throw new Error("No authentication token received from server");
        }

        console.log("✅ JWT token received from server");
        console.log("👤 New user:", isNewUser);
        console.log("🔑 Provider:", provider);

        // Step 4: Store the JWT token
        await AsyncStorage.setItem('firebaseToken', token);
        if (provider === 'facebook') {
            if (facebookAccessToken) {
                await AsyncStorage.setItem('authProvider', 'facebook');
                await AsyncStorage.setItem('facebookAccessToken', facebookAccessToken);
            } else {
                await AsyncStorage.removeItem('facebookAccessToken');
                await AsyncStorage.setItem('authProvider', 'facebook');
                console.warn("⚠️ Facebook access token missing from server OAuth callback");
            }
        }
        
        console.log("✅ Token stored successfully");

        return {
            success: true,
            token,
            isNewUser,
            provider: 'google'
        };

    } catch (error: any) {
        console.error("❌ Server-side Google OAuth error:", error);
        throw error;
    }
};

/**
 * Server-side Facebook OAuth Flow
 * Same as Google but for Facebook
 */
export const handleFacebookOAuthServer = async () => {
    try {
        console.log("🔐 === SERVER-SIDE FACEBOOK OAUTH START ===");

        // Step 1: Build Facebook OAuth consent URL (points to server callback)
        const facebookAuthUrl = new URL("https://www.facebook.com/v12.0/dialog/oauth");
        facebookAuthUrl.searchParams.set("client_id", OAUTH_CONFIG.facebook.appId);
        facebookAuthUrl.searchParams.set("redirect_uri", OAUTH_CONFIG.facebook.redirectUrl);
        facebookAuthUrl.searchParams.set("response_type", "code");
        facebookAuthUrl.searchParams.set("scope", "email,public_profile");
        if (Platform.OS === 'web') {
            facebookAuthUrl.searchParams.set("state", "web");
        }

        console.log("🌐 Opening Facebook auth URL:", facebookAuthUrl.toString());
        console.log("📍 Redirect URI (server):", OAUTH_CONFIG.facebook.redirectUrl);

        // Web uses postMessage, native uses deep links
        if (Platform.OS === 'web') {
            return await handleOAuthWeb(facebookAuthUrl.toString(), 'facebook');
        }

        // Step 2: Open browser - server will handle OAuth and redirect back
        const result = await WebBrowser.openAuthSessionAsync(
            facebookAuthUrl.toString(), 
            "laisvalaikio://oauth-callback"  // Our app's deep link for receiving token
        );

        console.log("📱 Browser result:", result.type);

        if (result.type === "cancel") {
            throw new Error("User cancelled Facebook login");
        }

        if (result.type !== "success") {
            throw new Error(`OAuth failed: ${result.type}`);
        }

        // Step 3: Extract JWT token from URL (server sent it via redirect)
        const resultUrl = result.url;
        console.log("🔗 Result URL:", resultUrl);

        const url = new URL(resultUrl);
        const token = url.searchParams.get("token");
        const isNewUser = url.searchParams.get("isNewUser") === "true";
        const provider = url.searchParams.get("provider");
        const facebookAccessToken = url.searchParams.get("facebookAccessToken");

        if (!token) {
            throw new Error("No authentication token received from server");
        }

        console.log("✅ JWT token received from server");
        console.log("👤 New user:", isNewUser);
        console.log("🔑 Provider:", provider);

        // Step 4: Store the JWT token
        await AsyncStorage.setItem('firebaseToken', token);
        if (provider === 'facebook') {
            if (facebookAccessToken) {
                await AsyncStorage.setItem('authProvider', 'facebook');
                await AsyncStorage.setItem('facebookAccessToken', facebookAccessToken);
            } else {
                await AsyncStorage.removeItem('facebookAccessToken');
                await AsyncStorage.setItem('authProvider', 'facebook');
                console.warn("⚠️ Facebook access token missing from server OAuth callback");
            }
        }
        
        console.log("✅ Token stored successfully");

        return {
            success: true,
            token,
            isNewUser,
            provider: 'facebook'
        };
        

    } catch (error: any) {
        console.error("❌ Server-side Facebook OAuth error:", error);
        throw error;
    }
};

/**
 * Handle OAuth on web platform using popup and postMessage
 */
const handleOAuthWeb = (authUrl: string, provider: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        console.log("🌐 Web OAuth: Opening popup...");
        
        // Open popup
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
            authUrl,
            'oauth-popup',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
            reject(new Error('Failed to open OAuth popup. Please allow popups for this site.'));
            return;
        }

        // Listen for postMessage from popup
        const messageHandler = async (event: MessageEvent) => {
            console.log("📨 Received message from origin:", event.origin);
            console.log("📨 Message data:", event.data);
            
            // Security: verify message type
            if (event.data && event.data.type === 'oauth-success') {
                console.log("✅ OAuth success message received!");
                
                // Clean up
                window.removeEventListener('message', messageHandler);
                if (!popup.closed) {
                    popup.close();
                }

                const { token, isNewUser, provider: responseProvider, facebookAccessToken } = event.data;
                
                if (!token) {
                    reject(new Error('No token received from OAuth callback'));
                    return;
                }

                console.log("✅ JWT token received from server via postMessage");
                console.log("👤 New user:", isNewUser);
                console.log("🔑 Provider:", responseProvider);

                // Store the JWT token
                await AsyncStorage.setItem('firebaseToken', token);
                if (responseProvider === 'facebook') {
                    if (facebookAccessToken) {
                        await AsyncStorage.setItem('authProvider', 'facebook');
                        await AsyncStorage.setItem('facebookAccessToken', facebookAccessToken);
                    } else {
                        await AsyncStorage.removeItem('facebookAccessToken');
                        await AsyncStorage.setItem('authProvider', 'facebook');
                        console.warn("⚠️ Facebook access token missing from web OAuth postMessage");
                    }
                }
                console.log("✅ Token stored successfully");

                resolve({
                    success: true,
                    token,
                    isNewUser,
                    provider: responseProvider
                });
            } else {
                console.log("⚠️ Received message but wrong type:", event.data?.type);
            }
        };

        console.log("👂 Adding message event listener...");
        window.addEventListener('message', messageHandler);

        // Check if popup was closed without success
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                console.log("⚠️ Popup was closed by user");
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                reject(new Error('OAuth popup was closed'));
            }
        }, 1000);

        // Store interval ID to clear it on success
        (messageHandler as any).checkClosedInterval = checkClosed;
    });
};
