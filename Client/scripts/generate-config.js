#!/usr/bin/env node

/**
 * Generate firebaseConfig.ts from environment variables
 * Run this before building to create the config file from secrets
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../src/utils/firebaseConfig.ts');

// Get from environment or use placeholders
// Users should set these via build scripts (build-android.cmd or build-android.ps1)
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '';
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';
const facebookAppSecret = process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET || '';
const serverBaseUrl = process.env.EXPO_PUBLIC_SERVER_BASE_URL || '';
const defaultOAuthUrl = process.env.EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL || '';
const oauthBaseUrl = process.env.EXPO_PUBLIC_OAUTH_BASE_URL || defaultOAuthUrl;
const clientBaseUrl = process.env.EXPO_PUBLIC_CLIENT_BASE_URL || '';

// Build the file content as a string (no template literals to avoid issues)
const configContent = `import { Platform } from 'react-native';

// Firebase REST API configuration
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "${apiKey}",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "${projectId}"
};

export const FIREBASE_REST_API = {
  signUp: \`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=\${firebaseConfig.apiKey}\`,
  signIn: \`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=\${firebaseConfig.apiKey}\`,
  signInAlt: \`https://www.identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=\${firebaseConfig.apiKey}\`,
  refreshToken: \`https://securetoken.googleapis.com/v1/token?key=\${firebaseConfig.apiKey}\`,
  getUserInfo: \`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=\${firebaseConfig.apiKey}\`,
  createAuthUri: \`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=\${firebaseConfig.apiKey}\`,
  signInWithIdp: \`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=\${firebaseConfig.apiKey}\`,
  base: \`https://identitytoolkit.googleapis.com/v1/accounts\`
};

const SERVER_BASE_URL = process.env.EXPO_PUBLIC_SERVER_BASE_URL || '${serverBaseUrl}';
const DEFAULT_PUBLIC_OAUTH_BASE_URL = process.env.EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL || '${defaultOAuthUrl}';
const PUBLIC_OAUTH_BASE_URL = process.env.EXPO_PUBLIC_OAUTH_BASE_URL || DEFAULT_PUBLIC_OAUTH_BASE_URL;
const localhost = 'localhost';
const WEB_REDIRECT_BASE = \`https://\${localhost}:8000\`;

function getRedirectUrl(provider) {
  if (Platform.OS === 'web') {
    return \`\${WEB_REDIRECT_BASE}/\${provider}\`;
  }
  return \`\${PUBLIC_OAUTH_BASE_URL}/\${provider}\`;
}

export const OAUTH_CONFIG = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '${googleClientId}',
    clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '${googleClientSecret}',
    redirectUrl: getRedirectUrl('google-callback'),
  },
  facebook: {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '${facebookAppId}',
    appSecret: process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET || '${facebookAppSecret}',
    redirectUrl: getRedirectUrl('facebook-callback'),
  },
};

export const CLIENT_BASE_URL = process.env.EXPO_PUBLIC_CLIENT_BASE_URL || '${clientBaseUrl}';
export const SERVER_URL = SERVER_BASE_URL;
export const OAUTH_BASE_URL = PUBLIC_OAUTH_BASE_URL;
`;

try {
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ Generated firebaseConfig.ts successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to generate firebaseConfig.ts:', error.message);
  process.exit(1);
}

