import { Platform } from 'react-native';

// Firebase REST API configuration
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDkOSq9KU3n5lBoI6a-VDZtxhKpGYCTanQ",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "bakis-aea6d"
};

export const FIREBASE_REST_API = {
  signUp: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
  signIn: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
  signInAlt: `https://www.identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
  refreshToken: `https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`,
  getUserInfo: `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
  createAuthUri: `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseConfig.apiKey}`,
  signInWithIdp: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseConfig.apiKey}`,
  base: `https://identitytoolkit.googleapis.com/v1/accounts`
};

const SERVER_BASE_URL = process.env.EXPO_PUBLIC_SERVER_BASE_URL || 'https://10.51.21.135:8000';
const DEFAULT_PUBLIC_OAUTH_BASE_URL = process.env.EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL || 'https://development-opt-specialist-plans.trycloudflare.com';
const PUBLIC_OAUTH_BASE_URL = process.env.EXPO_PUBLIC_OAUTH_BASE_URL || DEFAULT_PUBLIC_OAUTH_BASE_URL;
const localhost = 'localhost';
const WEB_REDIRECT_BASE = `https://${localhost}:8000`;

function getRedirectUrl(provider) {
  if (Platform.OS === 'web') {
    return `${WEB_REDIRECT_BASE}/${provider}`;
  }
  return `${PUBLIC_OAUTH_BASE_URL}/${provider}`;
}

export const OAUTH_CONFIG = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '816407630722-5jl350taiijr2dct3pj18tn3j38a0rj5.apps.googleusercontent.com',
    clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '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',
    redirectUrl: getRedirectUrl('google-callback'),
  },
  facebook: {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '2109372456101960',
    appSecret: process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET || '3138c568f90e288682f80f9286ef6c7d',
    redirectUrl: getRedirectUrl('facebook-callback'),
  },
};

export const CLIENT_BASE_URL = process.env.EXPO_PUBLIC_CLIENT_BASE_URL || 'https://10.51.21.135:8443';
export const SERVER_URL = SERVER_BASE_URL;
export const OAUTH_BASE_URL = PUBLIC_OAUTH_BASE_URL;
