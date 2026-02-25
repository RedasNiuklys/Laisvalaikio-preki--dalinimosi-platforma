import { useState, useCallback } from 'react';
import * as Facebook from 'expo-facebook';
import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OAUTH_CONFIG } from '../config/firebaseConfig';

interface FacebookInviteResult {
  success: boolean;
  requestIds?: string[];
  invitedCount?: number;
  error?: string;
}

export const useFacebookInvite = () => {
  const [loading, setLoading] = useState(false);

  const inviteFriends = useCallback(
    async (): Promise<FacebookInviteResult> => {
      try {
        setLoading(true);

        // Step 1: Check if we have Facebook access token
        const accessToken = await AsyncStorage.getItem('facebookAccessToken');
        if (!accessToken) {
          throw new Error(
            'Facebook access token not found. Please log in with Facebook first.'
          );
        }

        // Step 2: Try to initialize Facebook SDK (native only)
        if (Platform.OS !== 'web') {
          try {
            await Facebook.initializeAsync({
              appId: OAUTH_CONFIG.facebook.appId,
            });
          } catch (fbError) {
            console.warn('Facebook SDK initialization warning:', fbError);
            // Continue even if initialization fails - we can use Share API as fallback
          }
        }

        // Step 3: Share invite link
        const shareMessage =
          'Join me on Laisvalaikio! Sign in or register with Facebook and start sharing.';
        const inviteUrl = 'https://localhost:8443/login';

        if (Platform.OS === 'web') {
          const webNavigator = globalThis.navigator as Navigator | undefined;
          if (webNavigator?.share) {
            await webNavigator.share({
              title: 'Invite Friends to Laisvalaikio',
              text: shareMessage,
              url: inviteUrl,
            });
            return {
              success: true,
              invitedCount: 1,
            };
          }

          if (webNavigator?.clipboard?.writeText) {
            await webNavigator.clipboard.writeText(inviteUrl);
            return {
              success: true,
              invitedCount: 1,
            };
          }

          throw new Error('Sharing is not supported in this browser.');
        }

        const result = await Share.share(
          {
            message: shareMessage,
            url: inviteUrl,
            title: 'Invite Friends to Laisvalaikio',
          },
          { dialogTitle: 'Invite Friends' }
        );

        if (result.action === Share.dismissedAction) {
          return {
            success: false,
            error: 'Invitation cancelled by user',
          };
        }

        console.log('Invitation shared successfully');
        return {
          success: true,
          invitedCount: 1,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Facebook invite error:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    inviteFriends,
    loading,
  };
};

