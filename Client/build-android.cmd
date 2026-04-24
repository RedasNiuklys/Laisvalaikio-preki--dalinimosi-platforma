@echo off
REM Setup EAS Build with Environment Variables
REM This script generates firebaseConfig.ts and runs the EAS build

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Building Laisvalaikio App with EAS
echo ========================================
echo.

REM Set your environment variables here
REM Replace these with your actual values from Firebase and OAuth providers
set EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
set EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here
set EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
set EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
set EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here
set EXPO_PUBLIC_FACEBOOK_APP_SECRET=your_facebook_app_secret_here
set EXPO_PUBLIC_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
set EXPO_PUBLIC_MICROSOFT_TENANT_ID=your_microsoft_tenant_id_or_common
set EXPO_PUBLIC_SERVER_BASE_URL=https://your-server-ip:8000
set EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL=https://your-cloudflare-tunnel.trycloudflare.com
set EXPO_PUBLIC_OAUTH_BASE_URL=https://your-cloudflare-tunnel.trycloudflare.com
set EXPO_PUBLIC_CLIENT_BASE_URL=https://your-client-ip:8443
set EXPO_PUBLIC_FIREBASE_DYNAMIC_LINK_DOMAIN=https://yourapp.page.link

echo.
echo Step 1: Generating firebaseConfig.ts...
echo.

REM Run the generate-config script
node scripts/generate-config.js
if !errorlevel! neq 0 (
    echo ❌ Failed to generate config
    pause
    exit /b 1
)

echo.
echo Step 2: Starting EAS build for Android...
echo.

REM Run EAS build for Android
eas build --platform android

echo.
echo Build started! Check EAS dashboard for status.
echo.
pause
