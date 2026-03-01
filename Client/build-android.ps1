# Build script for EAS with environment variables
# Run: .\build-android.ps1

Write-Host ""
Write-Host "========================================"
Write-Host "Building Laisvalaikio App with EAS"
Write-Host "========================================"
Write-Host ""

# Set environment variables
# Replace these with your actual values from Firebase and OAuth providers
$env:EXPO_PUBLIC_FIREBASE_API_KEY = "your_firebase_api_key_here"
$env:EXPO_PUBLIC_FIREBASE_PROJECT_ID = "your_firebase_project_id_here"
$env:EXPO_PUBLIC_GOOGLE_CLIENT_ID = "your_google_client_id_here"
$env:EXPO_PUBLIC_GOOGLE_CLIENT_SECRET = "your_google_client_secret_here"
$env:EXPO_PUBLIC_FACEBOOK_APP_ID = "your_facebook_app_id_here"
$env:EXPO_PUBLIC_FACEBOOK_APP_SECRET = "your_facebook_app_secret_here"
$env:EXPO_PUBLIC_SERVER_BASE_URL = "https://your-server-ip:8000"
$env:EXPO_PUBLIC_DEFAULT_OAUTH_BASE_URL = "https://your-cloudflare-tunnel.trycloudflare.com"
$env:EXPO_PUBLIC_OAUTH_BASE_URL = "https://your-cloudflare-tunnel.trycloudflare.com"
$env:EXPO_PUBLIC_CLIENT_BASE_URL = "https://your-client-ip:8443"

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
