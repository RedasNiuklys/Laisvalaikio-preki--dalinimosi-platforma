# Testing OAuth on Physical Phone with Expo Go

## Pre-Test Checklist

- [ ] Phone and laptop on same WiFi network
- [ ] Firewall allows port 19000 on laptop
- [ ] Node.js and npm installed
- [ ] Expo Go app installed on phone
- [ ] Google Cloud Console updated with redirect URIs
- [ ] Facebook app updated with redirect URIs

## Step 1: Get Your Local IP Address

### Windows (PowerShell)

```powershell
ipconfig

# Output example:
# Ethernet adapter Local Area Connection:
#    IPv4 Address. . . . . . . . . . : 192.168.1.100

# Copy this IP: 192.168.1.100
```

### Mac (Terminal)

```bash
ifconfig

# Look for line like: inet 192.168.1.100
```

### Linux (Terminal)

```bash
hostname -I

# Output: 192.168.1.100 127.0.0.1
```

**Write down your IP address:** `___________________________`

## Step 2: Update firebaseConfig.ts

Open [Client/src/config/firebaseConfig.ts](./src/config/firebaseConfig.ts)

Find this line:
```typescript
const LOCAL_IP = "YOUR_LOCAL_IP"; // Update this when testing
```

Change it to your actual IP:
```typescript
const LOCAL_IP = "192.168.1.100"; // Your IP address
```

**Save the file.**

## Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project → **APIs & Services** → **Credentials**
3. Find and click your **OAuth 2.0 Client ID** (Web application type)
4. In the **Authorized redirect URIs** section, add this exact line:
   ```
   exp://192.168.1.100:19000/--/google-callback
   ```
   (Replace `192.168.1.100` with YOUR IP)
5. Click **Save**

## Step 4: Update Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Roles** → **Test Users**
4. Click **Add Test User** and make yourself a test user (required!)
5. Go to **Settings** → **Valid OAuth Redirect URIs**
6. Add this exact line:
   ```
   exp://192.168.1.100:19000/--/facebook-callback
   ```
   (Replace `192.168.1.100` with YOUR IP)
7. Click **Save**

## Step 5: Start Your Dev Server

On your laptop, in terminal:

```bash
cd Client
npm start

# You should see:
# ┌─────────────────────────────────────────────────────────────────────┐
# │ Expo Go                                                              │
# │                                                                      │
# │ ▌ Starting Metro Bundler                                            │
# │ ✓ Metro Bundler started                                             │
# │                                                                      │
# │ › Metro waiting on exp://192.168.1.100:19000                         │
# │                                                                      │
# │ Scan the QR code below with Expo Go (Android) or the Camera app     │
# │ (iOS) to open your app:                                             │
# │                                                                      │
# │  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  │
# │  ██ ▄▄▄▄▄ █ █████ ▀█▀▄ ▀█▀ ▀█▀ █▀▀▀▀█ ▄▄▄▄▄ ██              │
# │  ██ █   █ █   ▀  ▀  ▀  █   █   █ ██ █ █   █ ██              │
# │  ██ █▄▄▄█ █ ▀▀█▀▀ █ ▀ █ █   █   █ ▀▀ █ █▄▄▄█ ██              │
# │  ██▄▄▄▄▄▄▄█ █▄█▄█ █▄█▄█ █▄▄ ▄▄▄ █    █▄▄▄▄▄▄▄██              │
# │  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  │
# │                                                                      │
# │ Press s to switch to development build (EAS)                        │
# │ Press a to open Android emulator                                    │
# │ Press i to open iOS simulator                                       │
# │ Press e to share the app                                            │
# │ Press U to open the dev app menu                                    │
# │ Press w to open in web                                              │
# │                                                                      │
# │ Press j to open the debugger                                        │
# │ Press r to reload app                                               │
# │ Press o to open project code in your text editor                    │
# │                                                                      │
# │ ✓ Expo Go is running                                                │
# └─────────────────────────────────────────────────────────────────────┘
```

**Keep this terminal running!**

## Step 6: Open App on Phone

1. On your phone, open **Expo Go** app
2. Scan the QR code from your laptop screen
3. Wait for app to load (takes 30-60 seconds first time)
4. You should see your app open on phone!

## Step 7: Test Email/Password Login First

1. Go to Register or Login page
2. Enter test email: `test@example.com`
3. Enter password: `Test1234!`
4. Click Register
5. **Expected:** User created, you're logged in

✅ If this works, continue to next step

❌ If this doesn't work:
- Check backend is running (http://localhost:5050)
- Check server logs for errors
- Check browser console (Press `w` in expo terminal for web view)

## Step 8: Test Google OAuth

1. Back in app, go to Login page
2. Look for "Login with Google" button
3. **Click it**
4. **Expected:** Browser opens automatically

### Browser Should Show:

- Google login screen (or your Google account if already logged in)
- Something like: "Laisvalaikio prekių dalinimosi platforma wants to access your account"
- **Continue** or **Allow** button

### Click the Allow Button

- Browser should close automatically within 2-3 seconds
- You should be back in app
- **Expected:** You're logged in!

### If It Works: ✅

Congratulations! Google OAuth is working!

### If It Doesn't Work: ❌

Check these things:

**Browser didn't open?**
- Check if expo-web-browser is in plugins in app.json
- Restart app on phone

**Error message appeared?**
- Read the error carefully
- Common: "No callback URL received" → Check redirect URI in Google Cloud
- Common: "User cancelled login" → That's okay, just means you cancelled

**Closed after clicking Allow but didn't log in?**
- Check laptop terminal for error messages
- Look for red/orange text
- Copy error and search Google

**Stuck on "Connecting..."?**
- Wait 5-10 seconds
- If still stuck, close app and try again

## Step 9: Test Facebook OAuth

Same process as Google:

1. Look for "Login with Facebook" button
2. Click it
3. Browser opens to Facebook
4. See permission request for your app
5. Click "Continue as [Your Name]"
6. Browser closes, back in app
7. **Expected:** You're logged in!

## Step 10: Confirm Everything Works

Try this flow:

1. **Logout** (if there's a logout button)
2. **Login with Google**
3. **Logout**
4. **Login with Facebook**
5. **Logout**
6. **Register with email/password**
7. **Logout**
8. **Login with email/password**

If all 4 methods work: 🎉 **You're done!**

## Debugging Tips

### Check Laptop Terminal

Watch the laptop terminal while testing - it shows:

```
📤 Axios Request: { method: 'POST', url: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=...', ... }
📥 Axios Response: { status: 200, url: '...', data: 'Present' }
```

Good signs:
- Status 200 (success)
- Data is being sent
- No red error messages

### Check Phone Console

In Expo Go terminal on laptop, press `j` to open debugger browser console and see:

```
=== GOOGLE OAUTH FLOW START ===
Opening Google auth URL: https://accounts.google.com/o/oauth2/v2/auth?client_id=...
Received callback URL: exp://192.168.1.100:19000/--/google-callback?code=4/0AY0e-g...
Firebase login successful, UID: xyz123
Backend sync successful
```

Each line is a checkpoint - if you don't see all of them, the flow stopped there.

### Common Issues & Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| App won't load | WiFi connection | Same WiFi as laptop? |
| Port 19000 error | Firewall | Check Windows Defender allows port 19000 |
| "No callback URL" | Redirect URI | Does it match EXACTLY in Google/Facebook? |
| "User cancelled" | That's fine | Just means you cancelled or denied |
| Can't reach dev server | Laptop IP | Did you update firebaseConfig.ts correctly? |
| Browser doesn't open | WebBrowser plugin | Check app.json has "expo-web-browser" |

## Success Criteria

✅ You know OAuth is working when:

1. Browser opens automatically (you didn't tap a link)
2. You see Google/Facebook login screen
3. After clicking Allow, browser closes automatically
4. Back in app, you're logged in
5. Your user profile shows the correct name/email

## Next Steps

1. Add OAuth buttons to your actual login/register pages
2. Polish the UI
3. Test with friends
4. When ready: `eas build --platform android` for production
5. Deploy to Google Play Store

## Questions?

- Check console logs (Press `j` in Expo terminal)
- Check backend server logs (http://localhost:5050)
- Read [OAUTH_FLOW_DOCUMENTATION.md](./OAUTH_FLOW_DOCUMENTATION.md) for technical details
