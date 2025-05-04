import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize language from storage
const initializeLanguage = async () => {
    try {
        const storedLanguage = await AsyncStorage.getItem('appLanguage');
        const language = storedLanguage || DEFAULT_LANGUAGE;
        await i18n.changeLanguage(language);
    } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to default language if there's an error
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: DEFAULT_LANGUAGE, // default language
        fallbackLng: DEFAULT_LANGUAGE,
        interpolation: {
            escapeValue: false,
        },
    });

// Function to change language
export const changeLanguage = async (language: string) => {
    try {
        await AsyncStorage.setItem('appLanguage', language);
        console.log('Language changed to:', language);
        await i18n.changeLanguage(language);
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

// Initialize language
initializeLanguage();

export default i18n; 