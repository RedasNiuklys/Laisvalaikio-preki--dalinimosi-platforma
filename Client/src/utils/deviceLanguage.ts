import { getLocales } from 'expo-localization';

export const useDeviceLanguage = () => {
    const getDeviceLanguage = (): string => {
        try {
            const locales = getLocales();
            if (locales && locales.length > 0) {
                const languageCode = locales[0].languageCode || 'en';
                // Support Lithuanian and English, fallback to English for others
                return languageCode === 'lt' ? 'lt' : 'en';
            }
            return 'en';
        } catch (error) {
            console.error('Error getting device language:', error);
            return 'en';
        }
    };

    return { getDeviceLanguage };
};

export default useDeviceLanguage;
