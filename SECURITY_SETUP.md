# Environment Configuration Guide

## Overview
OAuth credentials and Firebase API keys have been moved to environment variables to prevent accidental exposure in version control.

## Setup Instructions

### 1. Client Configuration

Copy the example environment file:
```bash
cd Client
cp .env.example .env
```

Edit `.env` and add your actual credentials:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here

# OAuth Configuration  
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here
EXPO_PUBLIC_FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# Server URLs
EXPO_PUBLIC_SERVER_BASE_URL=https://your-server-ip:8000
EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL=https://your-cloudflare-tunnel.trycloudflare.com
EXPO_PUBLIC_OAUTH_BASE_URL=https://your-cloudflare-tunnel.trycloudflare.com

# Client URLs (for invites)
EXPO_PUBLIC_CLIENT_BASE_URL=https://your-client-url:8443
```

### 2. Server Configuration

Copy the example settings file:
```bash
cd Server
cp appsettings.example.json appsettings.json
```

Edit `appsettings.json` and add your actual credentials. See `appsettings.example.json` for the structure.

## Protected Files

The following files are now ignored by git and will NOT be committed:

**Client:**
- `Client/.env` - Your actual environment variables
- `Client/src/utils/firebaseConfig.ts` - Auto-generated, uses env vars

**Server:**
- `Server/appsettings.json` - Your actual server configuration
- `Server/appsettings.local.backup.json` - Backup file

## Template Files (Safe to Commit)

These example files ARE tracked in git as templates:
- `Client/.env.example`
- `Client/src/utils/firebaseConfig.example.ts`
- `Server/appsettings.example.json`

## Important Security Notes

1. **Never commit `.env` or `appsettings.json`** - They contain your actual credentials
2. **Rotate exposed credentials** - If any credentials were previously in git history, rotate them:
   - Google OAuth: https://console.cloud.google.com/apis/credentials
   - Facebook App: https://developers.facebook.com/apps/
   - Firebase: https://console.firebase.google.com/

3. **Git history was cleaned** - Old commits containing secrets have been removed, but anyone who pulled before the cleanup may still have them locally

## Fallback Behavior

If environment variables are not set, the code will fall back to hardcoded values in `firebaseConfig.ts`. This is for development convenience only - always use environment variables in production.

## Troubleshooting

If the app can't find your credentials:
1. Verify `.env` file exists in `Client/` directory
2. Restart the Expo dev server after changing `.env`
3. Check that variable names start with `EXPO_PUBLIC_` prefix
4. On native builds, you may need to rebuild the app after env changes
