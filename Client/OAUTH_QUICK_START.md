# OAuth with Google & Facebook - Quick Start Guide

## What's Implemented ✅

- ✅ Google OAuth login via Firebase REST API
- ✅ Facebook OAuth login via Firebase REST API
- ✅ Works with Expo Go on physical phones
- ✅ No native modules needed (no EAS build required)
- ✅ Tokens stored securely in AsyncStorage
- ✅ Auto-injected into all API requests
- ✅ Backend validation of Firebase tokens

## Setup Steps

### Step 1: Get Your Local IP

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" like: 192.168.1.100
```

### Step 2: Update firebaseConfig.ts

Edit [Client/src/config/firebaseConfig.ts](./src/config/firebaseConfig.ts):

```typescript
const LOCAL_IP = "192.168.1.100"; // Replace with YOUR IP
const DEV_REDIRECT_PREFIX = `exp://${LOCAL_IP}:19000/--`;
```

### Step 3: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project → **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID (Web application)
4. Under **Authorized redirect URIs**, add:
   ```
   exp://192.168.1.100:19000/--/google-callback
   http://localhost:19000
   http://localhost:8081
   ```
5. **Save**

### Step 4: Configure Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app → **Settings** → **Basic**
3. Add yourself as **Test User** (required for development!)
   - Click **Roles** → **Test Users** → **Add Test User**
4. Go to **Settings** → **Valid OAuth Redirect URIs**
5. Add:
   ```
   exp://192.168.1.100:19000/--/facebook-callback
   http://localhost:19000/
   http://localhost:8081/
   ```
6. **Save**

## Using OAuth in Your App

### Option 1: Add OAuth Buttons Component

```typescript
import { OAuthButtons } from '../components/OAuthButtons';

export default function LoginPage() {
    return (
        <View>
            {/* Your email/password form */}
            
            <OAuthButtons
                firstName="John"
                lastName="Doe"
                onSuccess={(user, token) => {
                    console.log('Logged in as:', user.email);
                    router.replace('/(tabs)/');
                }}
                onError={(error) => {
                    Alert.alert('Login Failed', error.message);
                }}
            />
        </View>
    );
}
```

### Option 2: Call OAuth Functions Directly

```typescript
import { authApi } from '../api/auth';

const handleGoogleLogin = async () => {
    try {
        const { user, token } = await authApi.googleLogin('John', 'Doe');
        console.log('Logged in:', user.email);
        // Update auth context
    } catch (error) {
        console.error('Login failed:', error.message);
    }
};
```

## How It Works

1. **User clicks "Login with Google"**
   ```
   Browser opens → User sees Google login screen
   ```

2. **User logs in and clicks "Allow"**
   ```
   Google validates credentials and redirects back to app
   ```

3. **App receives authorization code**
   ```
   Redirect URL: exp://192.168.1.100:19000/--/google-callback?code=4/0AY0e-g...
   ```

4. **Exchange code for Firebase token**
   ```
   POST to oauth2.googleapis.com/token → Get ID token
   POST to Firebase signInWithIdp → Get Firebase ID token
   ```

5. **Store token & log in**
   ```
   AsyncStorage.setItem('firebaseToken', idToken)
   AuthContext updated → User logged in!
   ```

6. **All future API requests include token**
   ```
   Authorization: Bearer eyJhbGc...
   ```

## Testing Checklist

Before testing, make sure:

- [ ] Updated `LOCAL_IP` in firebaseConfig.ts
- [ ] Registered redirect URIs in Google Cloud Console exactly
- [ ] Added yourself as Facebook Test User
- [ ] Phone on same WiFi as development machine
- [ ] `npm start` running on port 19000

**Test Flow:**
1. Open app on phone (scan Expo QR code)
2. Go to login/register page
3. Click "Login with Google"
4. Browser opens with Google consent screen
5. See your Google account
6. Click "Allow" (or whatever button appears)
7. Browser closes automatically
8. Back in app - you should be logged in!
9. Repeat for Facebook

## File Structure

```
Client/
├── src/
│   ├── api/
│   │   └── auth.ts                    # googleLogin(), facebookLogin()
│   ├── config/
│   │   └── firebaseConfig.ts          # OAuth config + keys
│   ├── utils/
│   │   └── oauthHandler.ts            # OAuth implementation
│   └── components/
│       └── OAuthButtons.tsx           # Ready-to-use buttons
├── app/
│   ├── google-callback.tsx            # Callback handler
│   └── facebook-callback.tsx          # Callback handler
├── app.json                           # Deep linking setup
├── OAUTH_SETUP_GUIDE.md               # Detailed setup
└── OAUTH_FLOW_DOCUMENTATION.md        # Technical documentation
```

## Troubleshooting

### "No callback URL received"
- Redirect URL doesn't match exactly
- Check spaces, capitalization, protocol (exp:// vs http://)
- Regenerate in Google/Facebook settings

### "User cancelled login"
- User clicked back or denied permissions
- Try again

### "Browser session dismissed"
- Browser app closed unexpectedly
- Make sure browser is available on phone

### App doesn't respond after clicking "Allow"
- Check console logs for errors
- Verify Firebase REST API is working
- Check backend is running at http://localhost:5050

### "Invalid OAuth configuration"
- Check that all keys in firebaseConfig.ts are correct
- Check Google Client ID and Facebook App ID
- Verify LOCAL_IP matches your machine

## File Locations

- **OAuth Config**: [firebaseConfig.ts](./src/config/firebaseConfig.ts)
- **OAuth Logic**: [oauthHandler.ts](./src/utils/oauthHandler.ts)
- **OAuth API**: [auth.ts](./src/api/auth.ts)
- **UI Component**: [OAuthButtons.tsx](./src/components/OAuthButtons.tsx)
- **Deep Linking**: [app.json](./app.json)
- **Detailed Setup**: [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md)
- **Technical Details**: [OAUTH_FLOW_DOCUMENTATION.md](./OAUTH_FLOW_DOCUMENTATION.md)

## Next Steps

1. ✅ Set up OAuth in Google/Facebook
2. ✅ Update LOCAL_IP in firebaseConfig.ts
3. ✅ Test email/password login first
4. ✅ Test Google OAuth
5. ✅ Test Facebook OAuth
6. 🎉 Ready for production!

## Production Deployment

When building for production with EAS:

1. Update firebaseConfig.ts:
   ```typescript
   const REDIRECT_PREFIX = PROD_REDIRECT_PREFIX; // "com.laisvalaikio.app"
   ```

2. Register production redirect URIs with Google/Facebook:
   ```
   com.laisvalaikio.app://google-callback
   com.laisvalaikio.app://facebook-callback
   ```

3. Add Android keystore fingerprint to Google/Facebook settings

4. Build with `eas build --platform android`

5. No code changes needed - OAuth flow works the same!
