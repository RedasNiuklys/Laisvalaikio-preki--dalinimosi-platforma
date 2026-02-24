import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// Import language files
import en from './locales/en.json';
import lt from './locales/lt.json';

const resources = {
    en: {
        translation: en,
    },
    lt: {
        translation: lt,
    },
};

const DEFAULT_LANGUAGE = 'en';

const getDeviceLanguage = () => {
    try {
        const locales = getLocales();
        const languageCode = locales?.[0]?.languageCode || DEFAULT_LANGUAGE;
        return languageCode === 'lt' ? 'lt' : DEFAULT_LANGUAGE;
    } catch (error) {
        console.error('Error getting device language:', error);
        return DEFAULT_LANGUAGE;
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getDeviceLanguage(),
        fallbackLng: DEFAULT_LANGUAGE,
        interpolation: {
            escapeValue: false,
        },
    });

// Function to change language
export const changeLanguage = async (language: string) => {
    try {
        await i18n.changeLanguage(language);
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

export default i18n; 