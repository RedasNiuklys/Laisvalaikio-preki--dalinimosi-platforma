import axios from 'axios';
import { Linking } from 'react-native';
import { LOGIN_ENDPOINT, USER_ENDPOINT } from '../utils/envConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const authApi = {
    login: async (email: string, password: string) => {
        console.log("Login started");
        const response = await axios.post(`${LOGIN_ENDPOINT}/login`, { email, password });
        return response.data;
    },

    googleLogin: async () => {
        if (Platform.OS === 'web') {
            // For web, use the server-side flow
            Linking.openURL(`${LOGIN_ENDPOINT}/google-login`);
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
                    const serverResponse = await axios.post(`${LOGIN_ENDPOINT}/google-mobile`, {
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
        Linking.openURL(`${LOGIN_ENDPOINT}/facebook-login`);
    },

    register: async (email: string, password: string) => {
        const response = await axios.post(`${LOGIN_ENDPOINT}/register`, { email, password });
        return response.data;
    },

    logout: async () => {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(
            `${LOGIN_ENDPOINT}/logout`,
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
        redirectUri: "http://10.151.2.109:8081",
        scopes: ['profile', 'email']
    });

    return {
        request,
        response,
        promptAsync
    };
}; 