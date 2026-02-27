import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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



i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: DEFAULT_LANGUAGE,
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