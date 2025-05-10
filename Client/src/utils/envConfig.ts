// Default values (will be overridden by server config)
const LOCAL_IP = '10.151.2.109';
const API_PORT = '5001';

const getBaseUrl = () => {
    return `https://${LOCAL_IP}:${API_PORT}/api`;
};

const getWebSocketUrl = () => {
    return `ws://${LOCAL_IP}:${API_PORT}/chatHub`;
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
export const USED_DATES_ENDPOINT = `${BASE_URL}/used-dates`;

// Google Maps API Key
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyBxLGeEKwJmr4coW9FDHVGTUFnIbkk4oqw';

// SignalR connection URL
export const WEBSOCKET_URL = getWebSocketUrl();
