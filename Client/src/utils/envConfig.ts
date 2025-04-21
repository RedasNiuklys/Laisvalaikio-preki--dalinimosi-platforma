export const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
export const USER_ENDPOINT = `${BASE_URL}/user`;
export const LOGIN_ENDPOINT = `${BASE_URL}/login`;
export const LOCATION_ENDPOINT = `${BASE_URL}/location`;
export const EQUIPMENT_ENDPOINT = `${BASE_URL}/equipment`;
export const CATEGORY_ENDPOINT = `${BASE_URL}/category`;
export const GOOGLE_API_KEY = process.env.Google_API_KEY || 'AIzaSyBxLGeEKwJmr4coW9FDHVGTUFnIbkk4oqw';

// WebSocket connection for chat
export const WS_BASE_URL = process.env.WS_BASE_URL || 'ws://localhost:5000';
