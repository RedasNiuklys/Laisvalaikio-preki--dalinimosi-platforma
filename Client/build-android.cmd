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
REM Replace these with your actual values
set EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDkOSq9KU3n5lBoI6a-VDZtxhKpGYCTanQ
set EXPO_PUBLIC_FIREBASE_PROJECT_ID=bakis-aea6d
set EXPO_PUBLIC_GOOGLE_CLIENT_ID=816407630722-5jl350taiijr2dct3pj18tn3j38a0rj5.apps.googleusercontent.com
set EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=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
set EXPO_PUBLIC_FACEBOOK_APP_ID=2109372456101960
set EXPO_PUBLIC_FACEBOOK_APP_SECRET=3138c568f90e288682f80f9286ef6c7d
set EXPO_PUBLIC_SERVER_BASE_URL=https://10.51.21.135:8000
set EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL=https://development-opt-specialist-plans.trycloudflare.com
set EXPO_PUBLIC_OAUTH_BASE_URL=https://development-opt-specialist-plans.trycloudflare.com
set EXPO_PUBLIC_CLIENT_BASE_URL=http://10.51.21.135:8081

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
