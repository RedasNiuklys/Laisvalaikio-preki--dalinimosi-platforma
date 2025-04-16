import AsyncStorage from '@react-native-async-storage/async-storage';


export const getAuthToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem("token");
    } catch (error) {
        console.error("Error getting auth token:", error);
        return null;
    }
};

export const setAuthToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem("token", token);
    } catch (error) {
        console.error("Error setting auth token:", error);
    }
};

export const removeAuthToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem("token");
    } catch (error) {
        console.error("Error removing auth token:", error);
    }
};
