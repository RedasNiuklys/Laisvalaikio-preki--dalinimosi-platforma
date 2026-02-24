import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { FIREBASE_REST_API, OAUTH_CONFIG } from '../config/firebaseConfig';
import { LOGIN_ENDPOINT } from './envConfig';
import { showToast } from '../components/Toast';

// Keep browser session active
WebBrowser.maybeCompleteAuthSession();

/**
 * Show confirmation dialog for account linking
 * Returns true if user confirms, false if cancels
 * Works on both native and web platforms
 */
export const showAccountLinkingDialog = (email: string, provider: string): Promise<boolean> => {
    return new Promise((resolve) => {
        // On web, use window.confirm() since react-native Alert doesn't work
        if (Platform.OS === 'web') {
            const message = `An account already exists with ${email}. Link your ${provider} account to your existing account?`;
            const confirmed = window.confirm(message);
            resolve(confirmed);
        } else {
            // On native, use Alert.alert()
            Alert.alert(
                "Link Account?",
                `An account already exists with ${email}. Link your ${provider} account to your existing account?`,
                [
                    {
                        text: "No, Cancel",
                        onPress: () => resolve(false),
                        style: "cancel"
                    },
                    {
                        text: "Yes, Link Account",
                        onPress: () => resolve(true),
                        style: "default"
                    }
                ]
            );
        }
    });
};

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
        // googleAuthUrl.searchParams.set("device_id", "ID");
        // googleAuthUrl.searchParams.set("device_name", "Device");
        // Don't set device_id/device_name - Google rejects these for browser-based OAuth
        // (WebBrowser.openAuthSessionAsync uses browser, not native SDK)

        console.log("Opening Google auth URL:", googleAuthUrl.toString());

        // Step 2: Open browser with OAuth URL
        // WebBrowser will automatically close when it sees the redirect URL
        // const result = await Google.useAuthRequest({
        //     clientId: OAUTH_CONFIG.google.clientId,
        //     redirectUri: OAUTH_CONFIG.google.redirectUrl
        // });
        // makeRedirectUri({
        //     native: OAUTH_CONFIG.google.redirectUrl
        // });
        const result = await WebBrowser.openAuthSessionAsync(
            googleAuthUrl.toString(), 
            OAUTH_CONFIG.google.redirectUrl  // Browser closes when it sees this URL
        );

        if (result.type === "cancel") {
            throw new Error("User cancelled Google login");
        }

        if (result.type !== "success") {
            throw new Error(`OAuth failed: ${result.type}`);
        }

        // Step 3: Extract authorization code from URL
        const resultUrl = result.url;
        const url = new URL(resultUrl);
        const code = url.searchParams.get("code");
        if (!code) {
            throw new Error("No authorization code received");
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
                grant_type: "authorization_code",
                projectNameForProxy: "@redasn/Client"

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
        const {idToken, localId, email } = firebaseResponse.data;
        console.log("Firebase login successful",idToken);
        
        // Use the original id_token from Google if idToken is not available

        // Step 6: Store tokens
        // Use the Google id_token as our Firebase token (Firebase validates it)
        await AsyncStorage.setItem('firebaseToken', idToken);
        await AsyncStorage.setItem('firebaseUid', localId);

        // Step 7: Check if this Firebase UID already exists (user logging in again)
        console.log("Checking if Firebase UID already exists...");
        let uidExists = false;
        try {
            const uidCheckResponse = await axios.post(LOGIN_ENDPOINT + "/check-firebase-uid", {
                uid: localId
            });
            uidExists = uidCheckResponse.data.exists;
            console.log("Firebase UID check result:", uidExists);
        } catch (uidCheckError) {
            console.warn("Failed to check Firebase UID:", uidCheckError);
        }

        // Step 8: If UID exists, user is just logging in - no need to ask about linking
        if (uidExists) {
            console.log("Firebase UID already exists, user is logging back in");
            // User already exists - just fetch their data and return
            const backendResponse = await axios.post(LOGIN_ENDPOINT + "/firebase-login", {
                firebaseToken: idToken,
                email: email || "",
                uid: localId
            });
            console.log("Backend login successful");
            console.log("Backend response:", backendResponse.data);
            return {
                user: backendResponse.data,
                token: idToken
            };
        } else {
            // Step 9: If UID doesn't exist, check if email exists (potential account linking)
            console.log("Checking if email already exists for account linking...");
            let emailExists = false;
            try {
                const checkResponse = await axios.post(LOGIN_ENDPOINT + "/check-email", {
                    email: email || ""
                });
                emailExists = checkResponse.data.exists;
                console.log("Email check result:", { emailExists });
            } catch (checkError) {
                console.warn("Failed to check email:", checkError);
            }

            // Step 10: If email exists, ask user for confirmation BEFORE linking
            if (emailExists) {
                const confirmed = await showAccountLinkingDialog(email || "this email", "Google");
                if (!confirmed) {
                    // User cancelled account linking
                    await AsyncStorage.removeItem('firebaseToken');
                    await AsyncStorage.removeItem('firebaseUid');
                    showToast("error", "Account linking cancelled");
                    throw new Error("Account linking cancelled");
                }
            }

            // Step 11: New UID + user confirmed linking (or new email) - create/link account
            console.log("Creating or linking new Firebase UID with existing account...");
            const backendResponse = await axios.post(LOGIN_ENDPOINT + "/firebase-register", {
                firebaseToken: idToken,
                email: email || "",
                uid: localId,
                firstName :firebaseResponse.data.firstName || '',
                lastName: '',
                theme,
                avatarUrl: firebaseResponse.data.photoUrl || ''
            });

            console.log("Backend sync successful");
            console.log("Backend response:", backendResponse.data);

            return {
                user: backendResponse.data,
                token: idToken
            };
        }
    } catch (error: any) {
        console.error("=== GOOGLE OAUTH ERROR ===");
        console.error("Error:", error.message);
        console.error("Response status:", error.response?.status);
        console.error("Response data:", error.response?.data);
        console.error("Error config URL:", error.config?.url);
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
        // WebBrowser will automatically close when it sees the redirect URL
        const result = await WebBrowser.openAuthSessionAsync(
            facebookAuthUrl.toString(), 
            OAUTH_CONFIG.facebook.redirectUrl  // Browser closes when it sees this URL
        );


        if (result.type === "cancel") {
            throw new Error("User cancelled Facebook login");
        }

        if (result.type !== "success") {
            throw new Error(`OAuth failed: ${result.type}`);
        }

        // Step 3: Extract authorization code from URL
        const resultUrl = result.url;
        const url = new URL(resultUrl);
        const code = url.searchParams.get("code");
        if (!code) {
            throw new Error("No authorization code received");
        }
        console.log("Authorization code received from Facebook:", code);
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

        // Step 6: Send Facebook OAuth data to backend for validation and token generation
        // The backend will:
        // 1. Validate the access token with Facebook Graph API
        // 2. Create/update the user in the database
        // 3. Generate and return a backend JWT token
        console.log("Sending Facebook OAuth data to backend for validation...");
        const backendResponse = await axios.post(LOGIN_ENDPOINT + "/validate-facebook-oauth", {
            accessToken: access_token,
            email: email || "",
            facebookId: userResponse.data.id,
            firstName: userResponse.data.name || "",
            lastName: "",
            theme,
            avatarUrl: userResponse.data.picture?.data?.url || ""
        });

        const backendToken = backendResponse.data.token;
        console.log("Backend validation successful, received JWT token");

        // Step 7: Store the backend JWT token
        await AsyncStorage.setItem('firebaseToken', backendToken);
        await AsyncStorage.setItem('authProvider', 'facebook');

        console.log("Facebook OAuth completed successfully");
        return {
            user: backendResponse.data,
            token: backendToken
        };

    } catch (error: any) {
        console.error("=== FACEBOOK OAUTH ERROR ===");
        console.error("Error:", error.message);
        console.error("Response status:", error.response?.status);
        console.error("Response data:", error.response?.data);
        console.error("Error config URL:", error.config?.url);
        throw error;
    }
};
