const appJson = require('./app.json');

const backendOrigin =
  process.env.EXPO_PUBLIC_API_ORIGIN ||
  process.env.EXPO_PUBLIC_SERVER_BASE_URL ||
  appJson.expo.extra.API_BASE_URL;

const webOrigin =
  process.env.EXPO_PUBLIC_WEB_ORIGIN ||
  process.env.EXPO_PUBLIC_CLIENT_BASE_URL ||
  backendOrigin;

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  appJson.expo.android?.config?.googleMaps?.apiKey ||
  '';

module.exports = ({ config }) => {
  const mergedAndroid = {
    ...(appJson.expo.android || {}),
    ...(config.android || {}),
    config: {
      ...(appJson.expo.android?.config || {}),
      ...((config.android && config.android.config) || {}),
      googleMaps: {
        ...(appJson.expo.android?.config?.googleMaps || {}),
        ...((config.android && config.android.config && config.android.config.googleMaps) || {}),
        ...(googleMapsApiKey ? { apiKey: googleMapsApiKey } : {}),
      },
    },
  };

  return {
    ...appJson.expo,
    ...config,
    android: mergedAndroid,
    extra: {
      ...appJson.expo.extra,
      ...(config.extra || {}),
      router: {
        ...(appJson.expo.extra?.router || {}),
        ...((config.extra && config.extra.router) || {}),
        origin: webOrigin,
      },
      API_BASE_URL: backendOrigin,
      WEB_ORIGIN: webOrigin,
      eas: {
        ...(appJson.expo.extra?.eas || {}),
        ...((config.extra && config.extra.eas) || {}),
      },
    },
  };
};