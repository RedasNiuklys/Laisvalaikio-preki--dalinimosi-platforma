# Build script for EAS with environment variables
# Run: .\build-android.ps1

Write-Host ""
Write-Host "========================================"
Write-Host "Building Laisvalaikio App with EAS"
Write-Host "========================================"
Write-Host ""

# Set environment variables
$env:EXPO_PUBLIC_FIREBASE_API_KEY = "AIzaSyDkOSq9KU3n5lBoI6a-VDZtxhKpGYCTanQ"
$env:EXPO_PUBLIC_FIREBASE_PROJECT_ID = "bakis-aea6d"
$env:EXPO_PUBLIC_GOOGLE_CLIENT_ID = "816407630722-5jl350taiijr2dct3pj18tn3j38a0rj5.apps.googleusercontent.com"
$env:EXPO_PUBLIC_GOOGLE_CLIENT_SECRET = "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"
$env:EXPO_PUBLIC_FACEBOOK_APP_ID = "2109372456101960"
$env:EXPO_PUBLIC_FACEBOOK_APP_SECRET = "3138c568f90e288682f80f9286ef6c7d"
$env:EXPO_PUBLIC_SERVER_BASE_URL = "https://10.51.21.135:8000"
$env:EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL = "https://development-opt-specialist-plans.trycloudflare.com"
$env:EXPO_PUBLIC_OAUTH_BASE_URL = "https://development-opt-specialist-plans.trycloudflare.com"
$env:EXPO_PUBLIC_CLIENT_BASE_URL = "https://10.51.21.135:8443"

Write-Host "Step 1: Generating firebaseConfig.ts..."
Write-Host ""

# Run the generate-config script
node scripts/generate-config.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate config"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Starting EAS build for Android..."
Write-Host ""

# Run EAS build
eas build --platform android --distribution internal

Write-Host ""
Write-Host "Build started! Check EAS dashboard for status."
Write-Host ""
Read-Host "Press Enter to exit"
