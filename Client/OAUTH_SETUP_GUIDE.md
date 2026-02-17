# OAuth Setup Guide for Expo Go

This guide explains how to set up Google and Facebook OAuth for Expo Go development and production builds.

## For Expo Go Development (Phone Testing)

### Step 1: Get Your Local IP Address

**Windows (PowerShell):**
```powershell
ipconfig
# Look for "IPv4 Address" under your network adapter, usually like 192.168.x.x
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" address
```

**Example:** `192.168.1.100`

### Step 2: Update firebaseConfig.ts

Replace `YOUR_LOCAL_IP` with your actual IP:

```typescript
const LOCAL_IP = "192.168.1.100"; // Your actual IP
const DEV_REDIRECT_PREFIX = `exp://${LOCAL_IP}:19000/--`;
```

**Important:** Expo Go always runs on port `19000` by default.

### Step 3: Register Redirect URLs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project → **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID (Web application)
4. Click to edit it
5. Add these redirect URIs under **Authorized JavaScript origins** and **Authorized redirect URIs**:

```
exp://192.168.1.100:19000/--/google-callback
http://localhost:19000
http://localhost:8081
```

6. Click **Save**

### Step 4: Register Redirect URLs in Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app → **Settings** → **Basic**
3. Go to **Settings** → **Valid OAuth Redirect URIs**
4. Add:
```
exp://192.168.1.100:19000/--/facebook-callback
http://localhost:19000/
http://localhost:8081/
```

5. Go to **App Roles** and add yourself as a **Test User** (required for development)
6. Click **Save**

---

## For Production (EAS Build)

### Android

1. Generate your app's Android keystore hash:
```bash
eas build --platform android --local
```

2. In Google Cloud Console:
   - Add `com.redasn.Client` as authorized package name
   - Add your keystore fingerprint

3. In Facebook App:
   - Add `com.redasn.Client` as authorized Android app package
   - Add your app hash from Facebook's hash key generator

4. Update `firebaseConfig.ts`:
```typescript
const PROD_REDIRECT_PREFIX = "com.laisvalaikio.app";
```

### iOS

Similar process but with bundle identifier instead.

---

## Testing the OAuth Flow

### Test with Expo Go:

1. **Start Expo Go on your phone** - scan the QR code from `npm start`

2. **Click "Login with Google" or "Login with Facebook"**

3. **Expected flow:**
   - Browser opens with OAuth consent screen
   - User logs in and authorizes
   - Browser closes automatically
   - App receives token and logs user in

### Troubleshooting:

- **"No callback URL received"** → Check that redirect URL matches exactly in Google/Facebook settings
- **"Browser session dismissed"** → User cancelled the login
- **Port 19000 blocked** → Make sure firewall allows it, or use a different port in `expo start --port 8082`

---

## Common Issues

### Issue: Deep link not working
- Verify app.json has correct scheme: `"scheme": "com.laisvalaikio.app"`
- Verify expo-web-browser is in plugins: `"plugins": ["expo-web-browser"]`

### Issue: Token not received from OAuth
- Check that Google/Facebook redirect URIs are EXACTLY matching
- Verify app IDs and secrets in firebaseConfig.ts are correct
- Check browser console for specific error messages

### Issue: Works on Expo Go but not after EAS build
- Make sure you registered the production scheme with Google/Facebook
- Android: Add SHA-1 fingerprint of your keystore
- iOS: Register bundle identifier in OAuth apps

---

## Environment Setup Summary

**For Development:**
```
Redirect: exp://YOUR_LOCAL_IP:19000/--/google-callback
Port: 19000 (default Expo Go port)
Scheme: com.laisvalaikio.app:// (for when moving to EAS)
```

**For Production (EAS):**
```
Redirect: com.laisvalaikio.app://google-callback
Scheme: com.laisvalaikio.app://
Package: com.redasn.Client (Android)
Bundle: com.redasn.Client (iOS)
```
