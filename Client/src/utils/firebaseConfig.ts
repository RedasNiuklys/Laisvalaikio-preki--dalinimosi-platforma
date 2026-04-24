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

export const FIREBASE_DYNAMIC_LINKS = {
  domainUriPrefix: process.env.EXPO_PUBLIC_FIREBASE_DYNAMIC_LINK_DOMAIN || '',
  shortLinksEndpoint: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${firebaseConfig.apiKey}`,
};

const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP || '10.233.192.135';
const LOCAL_WEB_SERVER_BASE = process.env.EXPO_PUBLIC_LOCAL_WEB_SERVER_BASE || `https://${LOCAL_IP}:8000`;
const LOCAL_MOBILE_SERVER_BASE = process.env.EXPO_PUBLIC_LOCAL_MOBILE_SERVER_BASE || `http://${LOCAL_IP}:8001`;
const SERVER_BASE_URL = process.env.EXPO_PUBLIC_SERVER_BASE_URL
  || process.env.EXPO_PUBLIC_API_ORIGIN
  || 'https://d11jxezcivrzgp.cloudfront.net';

function getRedirectUrl(provider: string) {
  const localBase = Platform.OS === 'web' ? LOCAL_WEB_SERVER_BASE : LOCAL_MOBILE_SERVER_BASE;

  if (process.env.EXPO_PUBLIC_SERVER_BASE_URL || process.env.EXPO_PUBLIC_API_ORIGIN) {
    return `${SERVER_BASE_URL}/api/MobileOAuth/${provider}`;
  }

  return `${localBase}/api/MobileOAuth/${provider}`;
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
  microsoft: {
    clientId: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID || 'b304ce0a-f081-46f5-a8ad-8a79ac7be3a3',
    tenantId: process.env.EXPO_PUBLIC_MICROSOFT_TENANT_ID || '0ddcfd75-9496-4ec2-8b62-eeef3a1ffa84',
    redirectUrl: getRedirectUrl('microsoft-callback'),
  },
};

export const CLIENT_BASE_URL = process.env.EXPO_PUBLIC_CLIENT_BASE_URL || '';
export const SERVER_URL = SERVER_BASE_URL;
