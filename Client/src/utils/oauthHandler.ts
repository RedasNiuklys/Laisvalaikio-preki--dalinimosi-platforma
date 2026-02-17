import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_REST_API, OAUTH_CONFIG } from '../config/firebaseConfig';
import { LOGIN_ENDPOINT } from './envConfig';

// Keep browser session active
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth Login Flow
 * 1. Opens browser with Google OAuth consent screen
 * 2. User logs in and authorizes
 * 3. Receives authorization code
 * 4. Exchange code for Firebase token
 */
export const handleGoogleOAuth = async (firstName: string | undefined, lastName: string | undefined, theme: string = "light") => {
    try {
        console.log("=== GOOGLE OAUTH FLOW START ===");

        // Step 1: Build Google OAuth consent URL
        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleAuthUrl.searchParams.set("client_id", OAUTH_CONFIG.google.clientId);
        googleAuthUrl.searchParams.set("redirect_uri", OAUTH_CONFIG.google.redirectUrl);
        googleAuthUrl.searchParams.set("response_type", "code");
        googleAuthUrl.searchParams.set("scope", "openid email profile");
        googleAuthUrl.searchParams.set("access_type", "offline");

        console.log("Opening Google auth URL:", googleAuthUrl.toString());

        // Step 2: Open browser with OAuth URL - redirectUrl is the return scheme
        const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl.toString(), OAUTH_CONFIG.google.redirectUrl);

        if (result.type === "cancel") {
            throw new Error("User cancelled Google login");
        }

        if (result.type === "dismiss") {
            throw new Error("Browser session dismissed");
        }

        // result.url contains the redirect URL with authorization code
        const resultUrl = (result as any).url;
        if (!resultUrl) {
            throw new Error("No callback URL received");
        }

        console.log("Received callback URL:", resultUrl);

        // Step 3: Extract authorization code from callback
        const url = new URL(resultUrl);
        const code = url.searchParams.get("code");

        if (!code) {
            throw new Error("No authorization code in callback");
        }

        console.log("Authorization code received");

        // Step 4: Exchange code for ID token using Firebase REST API
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                client_id: OAUTH_CONFIG.google.clientId,
                client_secret: OAUTH_CONFIG.google.clientSecret,
                code,
                redirect_uri: OAUTH_CONFIG.google.redirectUrl,
                grant_type: "authorization_code"
            }
        );

        const { id_token } = tokenResponse.data;
        console.log("ID token received from Google");

        // Step 5: Sign in to Firebase with ID token using signInWithIdp
        const firebaseResponse = await axios.post(FIREBASE_REST_API.signInWithIdp, {
            postBody: `id_token=${id_token}&providerId=google.com`,
            requestUri: OAUTH_CONFIG.google.redirectUrl,
            returnSecureToken: true
        });

        const { idToken, localId, email } = firebaseResponse.data;
        console.log("Firebase login successful, UID:", localId);

        // Step 6: Store tokens
        await AsyncStorage.setItem('firebaseToken', idToken);
        await AsyncStorage.setItem('firebaseUid', localId);

        // Step 7: Sync with backend
        const backendResponse = await axios.post(LOGIN_ENDPOINT + "/firebase-login", {
            firebaseToken: idToken,
            email: email || "",
            uid: localId,
            firstName,
            lastName,
            theme
        });

        console.log("Backend sync successful");
        return {
            user: backendResponse.data,
            token: idToken
        };
    } catch (error: any) {
        console.error("=== GOOGLE OAUTH ERROR ===");
        console.error("Error:", error.message);
        console.error("Response:", error.response?.data);
        throw error;
    }
};

/**
 * Facebook OAuth Login Flow
 */
export const handleFacebookOAuth = async (firstName: string | undefined, lastName: string | undefined, theme: string = "light") => {
    try {
        console.log("=== FACEBOOK OAUTH FLOW START ===");

        // Step 1: Build Facebook OAuth consent URL
        const facebookAuthUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
        facebookAuthUrl.searchParams.set("client_id", OAUTH_CONFIG.facebook.appId);
        facebookAuthUrl.searchParams.set("redirect_uri", OAUTH_CONFIG.facebook.redirectUrl);
        facebookAuthUrl.searchParams.set("response_type", "code");
        facebookAuthUrl.searchParams.set("scope", "public_profile,email");
        facebookAuthUrl.searchParams.set("state", "random_state_string");

        console.log("Opening Facebook auth URL:", facebookAuthUrl.toString());

        // Step 2: Open browser with OAuth URL
        const result = await WebBrowser.openAuthSessionAsync(facebookAuthUrl.toString(), OAUTH_CONFIG.facebook.redirectUrl);

        if (result.type === "cancel") {
            throw new Error("User cancelled Facebook login");
        }

        if (result.type === "dismiss") {
            throw new Error("Browser session dismissed");
        }

        // result.url contains the redirect URL with authorization code
        const resultUrl = (result as any).url;
        if (!resultUrl) {
            throw new Error("No callback URL received");
        }

        console.log("Received callback URL:", resultUrl);

        // Step 3: Extract authorization code from callback
        const url = new URL(resultUrl);
        const code = url.searchParams.get("code");

        if (!code) {
            throw new Error("No authorization code in callback");
        }

        console.log("Authorization code received");

        // Step 4: Exchange code for access token
        const tokenResponse = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
            params: {
                client_id: OAUTH_CONFIG.facebook.appId,
                client_secret: OAUTH_CONFIG.facebook.appSecret,
                code,
                redirect_uri: OAUTH_CONFIG.facebook.redirectUrl
            }
        });

        const { access_token } = tokenResponse.data;
        console.log("Access token received from Facebook");

        // Step 5: Get user info from Facebook
        const userResponse = await axios.get("https://graph.facebook.com/me", {
            params: {
                access_token,
                fields: "id,name,email,picture"
            }
        });

        const { email } = userResponse.data;
        console.log("Facebook user info received");

        // Step 6: Sign in to Firebase with Facebook token using signInWithIdp
        const firebaseResponse = await axios.post(FIREBASE_REST_API.signInWithIdp, {
            postBody: `access_token=${access_token}&providerId=facebook.com`,
            requestUri: OAUTH_CONFIG.facebook.redirectUrl,
            returnSecureToken: true
        });

        const { idToken, localId } = firebaseResponse.data;
        console.log("Firebase login successful, UID:", localId);

        // Step 7: Store tokens
        await AsyncStorage.setItem('firebaseToken', idToken);
        await AsyncStorage.setItem('firebaseUid', localId);

        // Step 8: Sync with backend
        const backendResponse = await axios.post(LOGIN_ENDPOINT + "/firebase-login", {
            firebaseToken: idToken,
            email: email || "",
            uid: localId,
            firstName,
            lastName,
            theme
        });

        console.log("Backend sync successful");
        return {
            user: backendResponse.data,
            token: idToken
        };
    } catch (error: any) {
        console.error("=== FACEBOOK OAUTH ERROR ===");
        console.error("Error:", error.message);
        console.error("Response:", error.response?.data);
        throw error;
    }
};
