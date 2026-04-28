# Frontend Deployment

This project now supports two separate frontend deployment targets:

- Expo Android development builds through EAS internal distribution
- Expo web static export hosted on AWS S3 + CloudFront

## 1. Configure environment values

Set these values before building:

```powershell
$env:EXPO_PUBLIC_API_ORIGIN = "https://your-api-domain"
$env:EXPO_PUBLIC_WEB_ORIGIN = "https://your-web-domain"
$env:EXPO_PUBLIC_CLIENT_BASE_URL = "https://your-web-domain"
```

Recommended mapping:

- `EXPO_PUBLIC_API_ORIGIN`: your backend/API CloudFront or custom API domain
- `EXPO_PUBLIC_WEB_ORIGIN`: your web frontend CloudFront or custom frontend domain
- `EXPO_PUBLIC_CLIENT_BASE_URL`: same frontend domain used in invite links and browser-facing callbacks

The Expo config now reads those values through [app.config.js](./app.config.js), so the app no longer assumes the backend CloudFront URL is also the web frontend origin.

## 2. Build Android through EAS without Google Play

Login once:

```powershell
npx eas login
```

Create an internal development build:

```powershell
npm run eas:build:development
```

What this does:

- uses the `development` profile from [eas.json](./eas.json)
- builds an Android APK
- enables the Expo development client
- distributes the build through EAS internal distribution instead of Google Play

Useful alternatives:

```powershell
npm run eas:build:preview
npm run eas:build:production
```

## 3. Host Expo web on AWS

Recommended AWS layout:

- S3 bucket for the exported static files
- CloudFront distribution in front of that bucket
- custom domain on CloudFront if you want a friendly public URL

CloudFront settings to apply:

- Default root object: `index.html`
- Custom error response `403` -> `/index.html` with response code `200`
- Custom error response `404` -> `/index.html` with response code `200`

Those error responses keep Expo Router routes working when users refresh or open a deep link directly.

## 4. Deploy the web build

Set AWS deployment variables in the same shell:

```powershell
$env:AWS_WEB_BUCKET = "your-s3-bucket-name"
$env:AWS_CLOUDFRONT_DISTRIBUTION_ID = "E1234567890ABC"
```

Then deploy:

```powershell
npm run web:deploy:aws
```

That command:

- runs `expo export --platform web`
- uploads the `dist` folder to S3
- applies long cache headers to hashed assets
- applies no-cache headers to HTML and JSON files
- invalidates CloudFront if a distribution ID is supplied

## 5. Suggested release flow

1. Deploy or verify the backend API URL.
2. Set `EXPO_PUBLIC_API_ORIGIN`, `EXPO_PUBLIC_WEB_ORIGIN`, and `EXPO_PUBLIC_CLIENT_BASE_URL`.
3. Run `npm run eas:build:development` for the Android development APK.
4. Run `npm run web:deploy:aws` for the browser frontend.