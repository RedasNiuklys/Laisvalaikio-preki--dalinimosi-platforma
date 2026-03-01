import { useState, useCallback } from 'react';
import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OAUTH_CONFIG } from '@/src/utils/firebaseConfig';
import * as Facebook from 'expo-facebook';

const DEFAULT_CLIENT_BASE_URL = 'http://10.51.21.135:8081';
const CLIENT_BASE_URL = process.env.EXPO_PUBLIC_CLIENT_BASE_URL || DEFAULT_CLIENT_BASE_URL;

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
            // Continue - we can use fallback Share API
          }
        }

        // Step 3: Share invite link
        const shareMessage =
          'Join me on Laisvalaikio! Sign in or register with Facebook and start sharing.';
        let inviteBase = CLIENT_BASE_URL;
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
          inviteBase = window.location.origin;
        }
        const inviteUrl = `${inviteBase.replace(/\/$/, '')}/login`;
        const shareText = `${shareMessage}\n${inviteUrl}`;

        // Step 4: Use Facebook Share Dialog (native platforms only)
        if (Platform.OS !== 'web') {
          try {
            // Use Facebook SDK share method
            const shareParams = {
              link: inviteUrl,
              quote: shareMessage,
            };
            
            const result = await (Facebook as any).shareAsync(shareParams);

            if (result && result.postId) {
              console.log('Successfully shared via Facebook:', result.postId);
              return {
                success: true,
                invitedCount: 1,
              };
            }
            return {
              success: false,
              error: 'Share cancelled or failed',
            };
          } catch (facebookError: any) {
            console.warn('Facebook share error, falling back to standard Share:', facebookError.message);
            // Continue to fallback
          }
        }

        // Fallback: Use standard Share API
        if (Platform.OS === 'web') {
          const webNavigator = globalThis.navigator as Navigator | undefined;
          if (webNavigator?.share) {
            await webNavigator.share({
              title: 'Invite Friends to Laisvalaikio',
              text: shareText,
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
            message: shareText,
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

