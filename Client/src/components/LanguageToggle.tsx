import React, { useState } from 'react';
import { IconButton, useTheme, Menu, Divider} from 'react-native-paper';
// import { initReactI18next, useTranslation } from 'react-i18next';
// import {changeLanguage} from 'i18next';
import i18n from '../i18n';
import { spacing } from '@/src/styles/globalStyles';

export default function LanguageToggle() {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const currentLanguage = i18n.language || 'en';

    const handleLanguageChange = async (lang: string) => {
        await i18n.changeLanguage(lang);
        closeMenu();
    };

    return (
        <Menu

            visible={visible}
            onDismiss={closeMenu}
            anchor={
                <IconButton
                    style={{ marginRight: spacing.sm }}
                    icon="translate"
                    onPress={openMenu}
                    size={24}
                    iconColor={theme.colors.primary}
                />
            }
            contentStyle={{
                backgroundColor: theme.colors.surface,
            }}
        >
            <Menu.Item
                onPress={() => handleLanguageChange('en')}
                title="English"
                trailingIcon={currentLanguage === 'en' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item
                onPress={() => handleLanguageChange('lt')}
                title="Lietuvių"
                trailingIcon={currentLanguage === 'lt' ? 'check' : undefined}
            />
        </Menu>
    );
}
