import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';

export const getAuthToken = async (): Promise<string> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
        throw new Error('No authentication token found');
    }
    return token;
};

export const setAuthToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_KEY);
};
