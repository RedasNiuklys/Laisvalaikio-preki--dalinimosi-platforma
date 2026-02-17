# Firebase Authentication Migration - Setup Guide

## ✅ Migration Complete

The codebase has been migrated from custom JWT authentication to Firebase Authentication on both Client and Server sides.

## 📋 Setup Steps Required

### 1. **Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard

### 2. **Enable Authentication Methods**

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable:
   - **Email/Password**
   - **Google** (optional)
   - **Facebook** (optional)

### 3. **Get Firebase Client Configuration**

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under "Your apps", click the **Web** icon (</>)
3. Register your app and copy the config object
4. Update **`Client/src/config/firebaseConfig.ts`** with your values:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. **Get Firebase Admin SDK Credentials (Server)**

1. In Firebase Console, go to **Project Settings** > **Service accounts**
2. Click **"Generate new private key"**
3. Save the JSON file as **`firebase-service-account.json`**
4. Place it in the **`Server/`** directory
5. **⚠️ IMPORTANT**: Add to `.gitignore`:

```
Server/firebase-service-account.json
```

**Alternative** (for production): Set environment variable:
```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### 5. **Add Firebase UID Migration**

Run this command to add the FirebaseUid column to the database:

```bash
cd Server
dotnet ef migrations add AddFirebaseUid
dotnet ef database update
```

### 6. **Configure Web Authorized Domains**

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add:
   - `localhost`
   - Your production domain (when deploying)

### 7. **Configure Android/iOS (if needed)**

For mobile apps, add platform-specific configurations:

**Android**:
1. Download `google-services.json` from Firebase Console
2. Place in `Client/android/app/`

**iOS**:
1. Download `GoogleService-Info.plist` from Firebase Console
2. Place in `Client/ios/`

## 🔄 What Changed

### Client Side

1. **Authentication**: Now uses Firebase Authentication methods
   - `auth().signInWithEmailAndPassword()`
   - `auth().createUserWithEmailAndPassword()`
   - `auth().signOut()`

2. **Auth State**: Managed by Firebase's `onAuthStateChanged` listener

3. **Tokens**: Firebase ID tokens automatically included in API requests

4. **UI Components**: Unchanged - RegisterPage and LoginPage work the same

### Server Side

1. **New Endpoints**:
   - `POST /api/login/firebase-login` - Sync Firebase users
   - `POST /api/login/firebase-register` - Create user with Firebase

2. **Token Verification**: Firebase Admin SDK verifies tokens

3. **Old Endpoints**: Kept for backwards compatibility

4. **Database**: Added `FirebaseUid` column to ApplicationUser

## 🚀 Testing

1. **Start Client**:
```bash
cd Client
npm start
```

2. **Start Server**:
```bash
cd Server
dotnet run
```

3. **Test Registration**:
   - Open the app
   - Go to Register screen
   - Enter email, password, name
   - Submit - should create Firebase user and sync to backend

4. **Test Login**:
   - Use registered credentials
   - Should authenticate via Firebase
   - Backend receives Firebase token

## 🔐 Security Benefits

- ✅ Industry-standard authentication
- ✅ Built-in email verification
- ✅ Password reset flows
- ✅ Secure token management
- ✅ OAuth providers (Google, Facebook)
- ✅ Free for unlimited users

## 📝 Notes

- Old JWT endpoints still work for backwards compatibility
- Existing users need to re-register or link Firebase account
- Firebase handles password security and hashing
- No need to manage JWT secrets anymore

## 🐛 Troubleshooting

**"Firebase service account JSON not found"**
- Ensure `firebase-service-account.json` is in Server/ directory
- Or set `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable

**"Invalid Firebase token"**
- Check Firebase config in Client is correct
- Ensure Firebase project matches service account

**Migration fails**
- Run: `dotnet ef database update`
- Check connection string in appsettings.json

## 📚 Documentation

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK (.NET)](https://firebase.google.com/docs/admin/setup)
- [React Native Firebase](https://rnfirebase.io/)
