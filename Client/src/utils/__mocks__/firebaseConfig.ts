export const firebaseConfig = { apiKey: 'test-api-key', projectId: 'test-project' };

export const FIREBASE_REST_API = {
  signUp: 'https://mock.firebase/signUp',
  signIn: 'https://mock.firebase/signIn',
  signInAlt: 'https://mock.firebase/signInAlt',
  refreshToken: 'https://mock.firebase/refreshToken',
  getUserInfo: 'https://mock.firebase/getUserInfo',
  createAuthUri: 'https://mock.firebase/createAuthUri',
  signInWithIdp: 'https://mock.firebase/signInWithIdp',
  base: 'https://mock.firebase/base',
};

export const FIREBASE_DYNAMIC_LINKS = {
  domainUriPrefix: '',
  shortLinksEndpoint: 'https://mock.firebase/shortLinks',
};

export const OAUTH_CONFIG = {
  google: { clientId: 'mock-google-client', clientSecret: 'mock-secret', redirectUrl: 'http://localhost/google' },
  facebook: { appId: 'mock-fb-app', appSecret: 'mock-fb-secret', redirectUrl: 'http://localhost/facebook' },
  microsoft: { clientId: 'mock-ms-client', tenantId: 'mock-tenant', redirectUrl: 'http://localhost/microsoft' },
};

export const CLIENT_BASE_URL = '';
export const SERVER_URL = 'https://mock.server';
