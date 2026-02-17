# OAuth Implementation - Complete Flow Documentation

## Architecture Overview

The OAuth implementation uses **Firebase REST API with browser redirects** to support Expo Go development without requiring native modules.

```
┌─────────────────────────┐
│     Expo Go on Phone    │
│  (React Native App)     │
└───────────┬─────────────┘
            │
            ├─→ User clicks "Login with Google"
            │
            ├─→ authApi.googleLogin() called
            │
            ├─→ handleGoogleOAuth() starts
            │
            ├─→ WebBrowser.openAuthSessionAsync() 
            │   (Opens system browser)
            │
            └─→ BROWSER SESSION
                │
                ├─→ User redirected to: accounts.google.com/o/oauth2/v2/auth
                ├─→ User logs in (if not already)
                ├─→ User authorizes app permissions
                ├─→ Google redirects to: exp://YOUR_IP:19000/--/google-callback?code=AUTH_CODE
                │
                └─→ WebBrowser receives callback URL
                    (Browser closes automatically)
                    │
                    └─→ Auth code extracted from URL
                        │
                        ├─→ POST to Google token endpoint
                        │   (Exchange code for ID token)
                        │
                        ├─→ Get Google ID token
                        │
                        ├─→ POST to Firebase signInWithIdp
                        │   (Exchange Google token for Firebase ID token)
                        │
                        ├─→ Get Firebase ID token + localId (UID)
                        │
                        ├─→ Save tokens to AsyncStorage
                        │
                        ├─→ POST to backend /firebase-login
                        │   (Sync user to database)
                        │
                        └─→ Return user data + Firebase token
                            │
                            └─→ Update AuthContext
                                (User logged in)
```

## File Structure

```
Client/
├── src/
│   ├── api/
│   │   └── auth.ts              # Main auth functions
│   │                             # - login(), register()
│   │                             # - googleLogin(), facebookLogin()
│   │
│   ├── config/
│   │   └── firebaseConfig.ts    # OAuth and Firebase config
│   │                             # - FIREBASE_REST_API endpoints
│   │                             # - OAUTH_CONFIG (Google, Facebook keys)
│   │
│   ├── context/
│   │   └── AuthContext.tsx       # Global auth state
│   │
│   └── utils/
│       └── oauthHandler.ts       # OAuth implementation
│                                 # - handleGoogleOAuth()
│                                 # - handleFacebookOAuth()
│
├── app/
│   ├── google-callback.tsx       # Fallback callback screen
│   ├── facebook-callback.tsx     # Fallback callback screen
│   └── app.json                  # Deep linking config
│
└── OAUTH_SETUP_GUIDE.md          # Setup instructions
```

## OAuth Flow Step-by-Step

### Google OAuth (Same for Facebook)

1. **User Initiates Login**
   ```typescript
   // RegisterPage.tsx or LoginPage.tsx
   const handleGoogleLogin = async () => {
       const result = await authApi.googleLogin(firstName, lastName, theme);
       // result = { user, token }
   };
   ```

2. **Build OAuth URL**
   ```typescript
   // oauthHandler.ts - handleGoogleOAuth()
   const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
   googleAuthUrl.searchParams.set("client_id", "YOUR_CLIENT_ID");
   googleAuthUrl.searchParams.set("redirect_uri", "exp://192.168.1.100:19000/--/google-callback");
   googleAuthUrl.searchParams.set("response_type", "code");
   googleAuthUrl.searchParams.set("scope", "openid email profile");
   ```

3. **Open Browser Session**
   ```typescript
   const result = await WebBrowser.openAuthSessionAsync(
       googleAuthUrl.toString(), 
       redirectUri  // exp://192.168.1.100:19000/--/google-callback
   );
   ```
   - System browser opens automatically
   - User sees Google login screen
   - User clicks "Allow" to authorize

4. **Browser Redirects Back to App**
   ```
   Browser: exp://192.168.1.100:19000/--/google-callback?code=4/0AY0e-g...
   ```
   - WebBrowser.openAuthSessionAsync() automatically captures this redirect
   - Returns: `{ type: 'success', url: 'exp://192.168.1.100:19000/--/google-callback?code=...' }`

5. **Extract Authorization Code**
   ```typescript
   const resultUrl = (result as any).url;
   const url = new URL(resultUrl);
   const code = url.searchParams.get("code");
   // code = "4/0AY0e-g..."
   ```

6. **Exchange Code for Google ID Token**
   ```typescript
   const tokenResponse = await axios.post(
       "https://oauth2.googleapis.com/token",
       {
           client_id: "YOUR_CLIENT_ID",
           client_secret: "YOUR_CLIENT_SECRET",
           code: "4/0AY0e-g...",
           redirect_uri: "exp://192.168.1.100:19000/--/google-callback",
           grant_type: "authorization_code"
       }
   );
   // Response: { id_token: "eyJhbGc...", access_token: "...", ... }
   ```

7. **Sign into Firebase with Google Token**
   ```typescript
   const firebaseResponse = await axios.post(
       "https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=...",
       {
           postBody: `id_token=${id_token}&providerId=google.com`,
           requestUri: "exp://192.168.1.100:19000/--/google-callback",
           returnSecureToken: true
       }
   );
   // Response: { idToken: "...", localId: "firebase_uid", email: "..." }
   ```

8. **Store Firebase Token**
   ```typescript
   await AsyncStorage.setItem('firebaseToken', idToken);
   await AsyncStorage.setItem('firebaseUid', localId);
   ```

9. **Sync User to Backend**
   ```typescript
   const backendResponse = await axios.post(
       "http://localhost:5050/api/login/firebase-login",
       {
           firebaseToken: idToken,
           email,
           uid: localId,
           firstName,
           lastName,
           theme
       }
   );
   // Backend validates Firebase token and creates/updates user
   // Response: { id, email, firstName, lastName, ... }
   ```

10. **Update App State**
    - AuthContext.tsx updates with user data and token
    - Axios interceptor now attaches token to all requests
    - User is logged in!

## Token Flow for Authenticated Requests

After login, all API calls include the Firebase token:

```typescript
// Axios Interceptor (auth.ts)
axios.interceptors.request.use(async (config) => {
    // For auth endpoints, skip token injection
    if (!config.url?.includes('/firebase-login') && 
        !config.url?.includes('/firebase-register')) {
        
        // Get token from AsyncStorage
        const token = await AsyncStorage.getItem('firebaseToken');
        if (token) {
            // Attach to Authorization header
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});
```

Backend validates this token:

```csharp
// Server/Program.cs
.OnTokenValidated(context => {
    var token = context.SecurityToken.RawData;
    var firebaseUser = firebaseAuthService.VerifyTokenAsync(token);
    // Find or create user in database
});
```

## Configuration Requirements

### For Expo Go Development

**1. Get Local IP:**
```powershell
ipconfig
# IPv4 Address: 192.168.1.100
```

**2. Update firebaseConfig.ts:**
```typescript
const LOCAL_IP = "192.168.1.100";
const DEV_REDIRECT_PREFIX = `exp://${LOCAL_IP}:19000/--`;
```

**3. Register with Google Cloud Console:**
- Authorized JavaScript origins: `exp://192.168.1.100:19000/--/google-callback`
- Authorized redirect URIs: `exp://192.168.1.100:19000/--/google-callback`

**4. Register with Facebook:**
- Valid OAuth redirect URIs: `exp://192.168.1.100:19000/--/facebook-callback`
- Add yourself as Test User

### For Production (EAS Build)

Update redirect URIs to use production scheme:
```typescript
const PROD_REDIRECT_PREFIX = "com.laisvalaikio.app";
// Redirect: com.laisvalaikio.app://google-callback
```

Register with Google/Facebook using production URLs.

## Error Handling

The implementation catches and logs errors at each step:

```typescript
try {
    // OAuth flow
} catch (error: any) {
    console.error("=== OAUTH ERROR ===");
    console.error("Error message:", error.message);
    console.error("Response:", error.response?.data);
    throw error;
}
```

Common errors:
- `"User cancelled Google login"` → User clicked back/cancel
- `"No callback URL received"` → Redirect URI mismatch
- `"No authorization code in callback"` → OAuth provider error
- Network errors → Firebase/OAuth service unavailable

## Expo Go Specific Notes

✅ **Why Expo Go works:**
- WebBrowser.openAuthSessionAsync() uses system browser (no native modules needed)
- Deep linking via `exp://` scheme is built into Expo
- Redirect captures happen automatically without custom handling

⚠️ **Limitations:**
- Local IP must match exactly in OAuth redirect URIs
- Can only test on same WiFi network as development machine
- Port 19000 must not be blocked by firewall

🚀 **Moving to Production:**
- Use `eas build` to create native app
- Register with production scheme: `com.laisvalaikio.app://`
- No code changes needed (redirects are already set up)

## Security Notes

⚠️ **Client Secrets in Code:**
```typescript
clientSecret: "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" // ⚠️ Exposed!
```

This is okay for MVP/testing because:
1. Secrets are bound to specific redirect URIs
2. An attacker would need your exact IP + port
3. Separate backend service accounts exist for production

**For Production:**
- Move OAuth token exchange to backend
- Backend calls Google/Facebook instead of client
- Client never sees OAuth secrets

## Testing Checklist

- [ ] Updated LOCAL_IP in firebaseConfig.ts
- [ ] Registered redirect URIs in Google Cloud Console
- [ ] Added yourself as Facebook Test User
- [ ] App is running on port 19000 with `npm start`
- [ ] Phone is on same WiFi network as development machine
- [ ] Can reach development machine IP from phone
- [ ] Click "Login with Google" → Browser opens
- [ ] Can see Google consent screen
- [ ] Can click "Allow"
- [ ] Browser closes automatically
- [ ] Token received and user logged in
- [ ] Same flow works for Facebook
