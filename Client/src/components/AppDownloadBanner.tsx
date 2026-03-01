import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform, Image } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const AppDownloadBanner = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    // Only show on web platform
    if (Platform.OS !== 'web') {
      return;
    }

    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('appDownloadBannerDismissed');
    if (dismissed === 'true') {
      return;
    }

    // Detect mobile web
    const checkMobileWeb = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      const isSmallScreen = window.innerWidth <= 768;
      
      return isMobile || isSmallScreen;
    };

    const mobile = checkMobileWeb();
    setIsMobileWeb(mobile);
    setIsVisible(mobile);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (Platform.OS === 'web') {
      localStorage.setItem('appDownloadBannerDismissed', 'true');
    }
  };

  const handleDownload = () => {
    // Detect iOS or Android
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    if (isIOS) {
      // Link to App Store (replace with your actual App Store link when available)
      Linking.openURL('https://apps.apple.com/app/your-app-id');
    } else if (isAndroid) {
      // Link to Google Play Store (replace with your actual Play Store link when available)
      Linking.openURL('https://play.google.com/store/apps/details?id=your.package.name');
    }
  };

  if (!isVisible || !isMobileWeb) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        <Image
          source={require('@/src/assets/favicon.png')}
          style={styles.appIcon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.onPrimary }]}>
            {t('appDownloadBanner.title', 'Get the App')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onPrimary }]}>
            {t('appDownloadBanner.subtitle', 'Better experience on mobile app')}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleDownload} 
          style={[styles.downloadButton, { backgroundColor: theme.colors.onPrimary }]}
        >
          <Text style={[styles.downloadText, { color: theme.colors.primary }]}>
            {t('appDownloadBanner.download', 'Download')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.9,
  },
  downloadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});

export default AppDownloadBanner;
