import { Platform } from 'react-native';

// Default values (will be overridden by server config)
const LOCAL_IP = '10.51.21.135';
// Use HTTPS on port 8000 for web, HTTP on port 8001 for mobile
const API_PORT = Platform.OS === 'web' ? '8000' : '8001';
const API_PROTOCOL = Platform.OS === 'web' ? 'https' : 'http';
const WS_PROTOCOL = Platform.OS === 'web' ? 'wss' : 'ws';

const getBaseUrl = () => {
    console.log(`${API_PROTOCOL}://${LOCAL_IP}:${API_PORT}/api`);
    return `${API_PROTOCOL}://${LOCAL_IP}:${API_PORT}/api`;
};

const getWebSocketUrl = () => {
    return `${WS_PROTOCOL}://${LOCAL_IP}:${API_PORT}/chatHub`;
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
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyBxLGeEKwJmr4coW9FDHVGTUFnIbkk4oqw';

// SignalR connection URL
export const WEBSOCKET_URL = getWebSocketUrl();
