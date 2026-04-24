import { Platform } from 'react-native';

const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP || '10.233.192.135';
const LOCAL_API_PORT = Platform.OS === 'web' ? '8000' : '8001';
const LOCAL_API_PROTOCOL = Platform.OS === 'web' ? 'https' : 'http';

const getOriginUrl = () => {
    if (process.env.EXPO_PUBLIC_API_ORIGIN) {
        return process.env.EXPO_PUBLIC_API_ORIGIN;
    }

    return `${LOCAL_API_PROTOCOL}://${LOCAL_IP}:${LOCAL_API_PORT}`;
};

const getBaseUrl = () => {
    const origin = getOriginUrl();
    console.log(`${origin}/api`);
    return `${origin}/api`;
};

const getWebSocketUrl = () => {
    const origin = getOriginUrl();
    const wsOrigin = origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    return `${wsOrigin}/chatHub`;
};

export const BASE_URL = getBaseUrl();
export const USER_ENDPOINT = `${BASE_URL}/user`;
export const LOGIN_ENDPOINT = `${BASE_URL}/login`;
export const LOCATION_ENDPOINT = `${BASE_URL}/location`;
export const EQUIPMENT_ENDPOINT = `${BASE_URL}/equipment`;
export const CATEGORY_ENDPOINT = `${BASE_URL}/category`;
export const CHAT_HUB_ENDPOINT = getWebSocketUrl();
export const CHAT_ENDPOINT = `${BASE_URL}/chat`;
export const MAINTENANCE_RECORD_ENDPOINT = `${BASE_URL}/maintenance-record`;
export const EQUIPMENT_IMAGE_ENDPOINT = `${BASE_URL}/equipment-image`;
export const BOOKING_ENDPOINT = `${BASE_URL}/booking`;
// Google Maps API Key
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyDkOSq9KU3n5lBoI6a-VDZtxhKpGYCTanQ';

// SignalR connection URL
export const WEBSOCKET_URL = getWebSocketUrl();
