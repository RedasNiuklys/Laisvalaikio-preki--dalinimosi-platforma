import axios from 'axios';
import { Linking } from 'react-native';
import { LOGIN_ENDPOINT, USER_ENDPOINT } from '../utils/envConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Add axios interceptors for debugging
axios.interceptors.request.use(
    (config) => {
        console.log('📤 Axios Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            data: config.data ? 'Present' : 'None'
        });
        return config;
    },
    (error) => {
        console.error('❌ Axios Request Error:', error);
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => {
        console.log('📥 Axios Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data ? 'Present' : 'None'
        });
        return response;
    },
    (error) => {
        console.error('❌ Axios Response Error:', {
            message: error.message,
            status: error.response?.status,
            url: error.config?.url,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (email: string, password: string) => {
        try {
            console.log("=== LOGIN API CALL ===");
            console.log("Login endpoint:", LOGIN_ENDPOINT);
            console.log("Full URL:", LOGIN_ENDPOINT + "/loginUser");
            console.log("Request payload:", { email, password: "***" });

            const response = await axios.post(LOGIN_ENDPOINT + "/loginUser", { email, password });

            console.log("Login response status:", response.status);
            console.log("Login response data:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("=== LOGIN ERROR ===");
            console.error("Error message:", error.message);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
            console.error("Error config:", error.config?.url);
            throw error;
        }
    },

    googleLogin: async () => {
        if (Platform.OS === 'web') {
            // For web, use the server-side flow
            Linking.openURL(`${LOGIN_ENDPOINT.replace('/login', '')}/google-login`);
        } else {
            try {
                //console.log
                ("Google login started");
                const { request, response, promptAsync } = useGoogleAuth();
                const result = await promptAsync();

                if (result?.type === 'success') {
                    // Get the token from the response
                    const { id_token } = result.params;

                    // Send the token to your server
                    const serverResponse = await axios.post(`${LOGIN_ENDPOINT.replace('/login', '')}/google-mobile`, {
                        idToken: id_token
                    });

                    // Store the JWT token from your server
                    await AsyncStorage.setItem('token', serverResponse.data.token);
                    return serverResponse.data;
                }
            } catch (error) {
                console.error('Google login error:', error);
                throw error;
            }
        }
    },

    facebookLogin: () => {
        Linking.openURL(`${LOGIN_ENDPOINT.replace('/login', '')}/facebook-login`);
    },

    register: async (email: string, password: string, firstName: string, lastName: string, theme: string = "light") => {
        console.log("Register endpoint:", `${LOGIN_ENDPOINT.replace('/login', '')}/register`);
        const response = await axios.post(`${LOGIN_ENDPOINT.replace('/login', '')}/register`, {
            email,
            password,
            firstName,
            lastName,
            theme
        });
        return response.data;
    },

    logout: async () => {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(
            `${LOGIN_ENDPOINT.replace('/login', '')}/logout`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    getUser: async () => {
        const token = await AsyncStorage.getItem('token');

        const response = await axios.get(`${USER_ENDPOINT}/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
};

// For mobile, we'll use Expo's auth session
export const useGoogleAuth = () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        redirectUri: "http://10.151.26.44:8081",
        scopes: ['profile', 'email']
    });

    return {
        request,
        response,
        promptAsync
    };
}; 