import axios from 'axios';
import { LOGIN_ENDPOINT, USER_ENDPOINT } from '../utils/envConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_REST_API } from '../utils/firebaseConfig';
import { handleGoogleOAuth, handleFacebookOAuth } from '../utils/oauthHandler';

export const authApi = {
    login: async (email: string, password: string) => {
        try {
            console.log("=== FIREBASE REST LOGIN ===");
            console.log("Email:", email);

            // Sign in with Firebase REST API
            let response;
            const headers = {
                'Content-Type': 'application/json'
            };
            try {
                console.log("Trying primary endpoint:", FIREBASE_REST_API.signIn);
                response = await axios.post(FIREBASE_REST_API.signIn, {
                    email,
                    password,
                    returnSecureToken: true
                }, { headers });
            } catch (error: any) {
                // If first endpoint fails, try alternative
                if (error.response?.status === 401 || error.response?.status === 400) {
                    console.log("Primary endpoint failed, trying alternative...");
                    console.log("Trying alternative endpoint:", FIREBASE_REST_API.signInAlt);
                    response = await axios.post(FIREBASE_REST_API.signInAlt, {
                        email,
                        password,
                        returnSecureToken: true
                    }, { headers });
                } else {
                    throw error;
                }
            }

            const { idToken, localId } = response.data;
            console.log("Firebase login successful, UID:", localId);

            // Store token in AsyncStorage with error handling
            try {
                console.log("Storing firebaseToken in AsyncStorage...");
                await AsyncStorage.setItem('firebaseToken', idToken);
                console.log("✓ firebaseToken stored");
            } catch (storageError: any) {
                console.error("❌ Error storing firebaseToken:", storageError.message);
                throw new Error(`AsyncStorage error for firebaseToken: ${storageError.message}`);
            }

            try {
                console.log("Storing firebaseUid in AsyncStorage...");
                await AsyncStorage.setItem('firebaseUid', localId);
                console.log("✓ firebaseUid stored");
            } catch (storageError: any) {
                console.error("❌ Error storing firebaseUid:", storageError.message);
                throw new Error(`AsyncStorage error for firebaseUid: ${storageError.message}`);
            }

            // Send Firebase token to backend for user sync
            const backendResponse = await axios.post(LOGIN_ENDPOINT + "/firebase-login", {
                firebaseToken: idToken,
                email,
                uid: localId
            });

            console.log("Backend sync successful");
            return {
                user: backendResponse.data,
                token: idToken
            };
        } catch (error: any) {
            console.error("=== LOGIN ERROR ===");
            console.error("Error message:", error.message);
            console.error("Error response:", error.response?.data);
            throw error;
        }
    },

    register: async (email: string, password: string, firstName: string | null, lastName: string | null, theme: string = "light") => {
        try {
            console.log("=== FIREBASE REST REGISTER ===");
            console.log("Email:", email);
            console.log("Firebase API Key:", FIREBASE_REST_API.signUp.substring(0, 80) + "...");

            // Sign up with Firebase REST API
            const headers = {
                'Content-Type': 'application/json'
            };
            const response = await axios.post(FIREBASE_REST_API.signUp, {
                email,
                password,
                returnSecureToken: true
            }, { headers });

            const { idToken, localId } = response.data;
            console.log("Firebase registration successful, UID:", localId);

            // Store token in AsyncStorage with error handling
            try {
                console.log("Storing firebaseToken in AsyncStorage...");
                await AsyncStorage.setItem('firebaseToken', idToken);
                console.log("✓ firebaseToken stored");
            } catch (storageError: any) {
                console.error("❌ Error storing firebaseToken:", storageError.message);
                throw new Error(`AsyncStorage error for firebaseToken: ${storageError.message}`);
            }

            try {
                console.log("Storing firebaseUid in AsyncStorage...");
                await AsyncStorage.setItem('firebaseUid', localId);
                console.log("✓ firebaseUid stored");
            } catch (storageError: any) {
                console.error("❌ Error storing firebaseUid:", storageError.message);
                throw new Error(`AsyncStorage error for firebaseUid: ${storageError.message}`);
            }

            // Send to backend to create user record
            const backendResponse = await axios.post(LOGIN_ENDPOINT + "/firebase-register", {
                firebaseToken: idToken,
                email: email,
                uid: localId,
                firstName: firstName,
                lastName: lastName,
                theme: theme
            });

            console.log("Backend user creation successful");
            return {
                user: backendResponse.data,
                token: idToken
            };
        } catch (error: any) {
            console.error("=== REGISTER ERROR ===");
            console.error("Error message:", error.message);
            console.error("Error response:", error.response?.data);
            console.error("Full error:", error);
            console.error("Error status:", error.response?.status);
            console.error("Error URL:", error.config?.url);
            throw error;
        }
    },

    logout: async () => {
        try {
            // Clear Firebase token
            console.log("Clearing firebaseToken from AsyncStorage...");
            await AsyncStorage.removeItem('firebaseToken');
            console.log("✓ firebaseToken cleared");
            
            console.log("Clearing firebaseUid from AsyncStorage...");
            await AsyncStorage.removeItem('firebaseUid');
            console.log("✓ firebaseUid cleared");

            // Clear Facebook tokens if they exist
            console.log("Clearing Facebook auth tokens...");
            await AsyncStorage.removeItem('facebookAccessToken');
            await AsyncStorage.removeItem('facebookId');
            console.log("✓ Facebook tokens cleared");
            
            console.log("Logout successful");
        } catch (error: any) {
            console.error("❌ Logout error:", error.message);
            throw error;
        }
    },

    getUser: async () => {
        try {
            const token = await AsyncStorage.getItem('firebaseToken');
            
            if (!token) {
                throw new Error("No authentication token");
            }

            // Get user data from backend
            const response = await axios.get(`${USER_ENDPOINT}/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error("Get user error:", error);
            throw error;
        }
    },

    // Get current Firebase token
    getFirebaseToken: async (): Promise<string | null> => {
        try {
            console.log("Getting firebaseToken from AsyncStorage...");
            const token = await AsyncStorage.getItem('firebaseToken');
            console.log(token ? "✓ Token found" : "✗ Token not found");
            return token;
        } catch (error: any) {
            console.error("❌ Get Firebase token error:", error);
            return null;
        }
    },
    // Google OAuth Login (REST API approach with browser redirect)
    googleLogin: async (firstName: string | undefined, lastName: string | undefined, theme: string = "light") => {
        return handleGoogleOAuth(firstName, lastName, theme);
    },

    // Facebook OAuth Login (REST API approach with browser redirect)
    facebookLogin: async (firstName: string | undefined, lastName: string | undefined, theme: string = "light") => {
        return handleFacebookOAuth(firstName, lastName, theme);
    }
};
 