import { Platform } from 'react-native';

// Firebase REST API configuration
// Using Firebase Auth REST API instead of SDK for Expo compatibility

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "<YOUR_FIREBASE_API_KEY>",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "<YOUR_FIREBASE_PROJECT_ID>"
};

export const FIREBASE_REST_API = {
  signUp: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
  signIn: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
  // Alternative endpoint (some projects require this)
  signInAlt: `https://www.identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
  refreshToken: `https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`,
  getUserInfo: `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
  createAuthUri: `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseConfig.apiKey}`,
  // OAuth via REST API (signInWithIdp)
  signInWithIdp: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseConfig.apiKey}`,
  base: `https://identitytoolkit.googleapis.com/v1/accounts`
};

// OAuth Configuration (for Google and Facebook)
// Server-side OAuth flow: callbacks handled by backend

// OAuth callback base URLs
// - For mobile/native Google OAuth use a public HTTPS domain (Cloudflare tunnel)
// - EXPO_PUBLIC_OAUTH_BASE_URL example: https://oauth.yourdomain.com
const SERVER_BASE_URL = process.env.EXPO_PUBLIC_SERVER_BASE_URL || 'https://10.233.192.135:8000';
const DEFAULT_PUBLIC_OAUTH_BASE_URL = process.env.EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL || 'https://your-tunnel-url.trycloudflare.com';
const PUBLIC_OAUTH_BASE_URL = process.env.EXPO_PUBLIC_OAUTH_BASE_URL || DEFAULT_PUBLIC_OAUTH_BASE_URL;

// For web development (client-side OAuth)
const localhost = 'localhost';
const WEB_REDIRECT_BASE = `https://${localhost}:8000`;

/**
 * Get OAuth provider redirect URL
 * Server-side OAuth approach:
 * - OAuth callbacks go to server (https://your-server:8000/api/MobileOAuth/...)
 * - Server handles authentication and returns JWT token
 * - Server redirects to app custom scheme (laisvalaikio://oauth-callback?token=xxx)
 * - Mobile app retrieves token from the redirect URL
 * 
 * Benefits:
 * ✅ No deep link registration with OAuth providers needed
 * ✅ OAuth secrets stay on server (more secure)
 * ✅ Works on same network with existing HTTPS certs
 * ✅ No ngrok dependency
 */
const getRedirectUrl = (path: string) => {
  // Web local testing: localhost callback
  // Native/mobile: prefer public HTTPS callback; fallback to LAN IP
  const callbackBaseRaw = Platform.OS === 'web'
    ? WEB_REDIRECT_BASE
    : (PUBLIC_OAUTH_BASE_URL || SERVER_BASE_URL);
  const callbackBase = callbackBaseRaw.replace(/\/$/, '');
  return `${callbackBase}/api/MobileOAuth/${path}`;
}

console.log('🔧 firebaseConfig.ts: Platform:', Platform.OS, '| Server OAuth Redirect:', getRedirectUrl('google-callback'));

export const OAUTH_CONFIG = {
  google: {
    // IMPORTANT: Must match server's Authentication:Google:ClientId in appsettings.json
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "<YOUR_GOOGLE_CLIENT_ID>",
    clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || "<YOUR_GOOGLE_CLIENT_SECRET>",
    redirectUrl: getRedirectUrl('google-callback')
  },
  facebook: {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "<YOUR_FACEBOOK_APP_ID>",
    appSecret: process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET || "<YOUR_FACEBOOK_APP_SECRET>",
    redirectUrl: getRedirectUrl('facebook-callback')
  }
};

console.log('✅ firebaseConfig.ts: Module loaded, OAUTH_CONFIG ready');
