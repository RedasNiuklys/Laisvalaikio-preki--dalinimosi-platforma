import axios from 'axios';
import { Linking } from 'react-native';
import { LOGIN_ENDPOINT } from '../utils/envConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authApi = {
    login: async (email: string, password: string) => {
        const response = await axios.post(`${LOGIN_ENDPOINT}/login`, { email, password });
        return response.data;
    },

    googleLogin: () => {
        Linking.openURL(`${LOGIN_ENDPOINT}/google-login`);
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
    }
}; 