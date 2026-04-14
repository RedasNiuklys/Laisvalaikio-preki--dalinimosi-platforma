import { useState, useCallback } from 'react';
import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from '@/src/context/AuthContext';
import { FIREBASE_DYNAMIC_LINKS } from '@/src/utils/firebaseConfig';
import { useTranslation } from 'react-i18next';

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
  const { user } = useAuth();
  const { t } = useTranslation();

  const createInviteLink = useCallback(async (referrerId: string, inviterName?: string): Promise<string> => {
    let inviteBase = CLIENT_BASE_URL;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
      inviteBase = window.location.origin;
    }

    const loginUrl = new URL(`${inviteBase.replace(/\/$/, '')}/login`);
    loginUrl.searchParams.set('referrer', referrerId);
    if (inviterName) {
      loginUrl.searchParams.set('inviterName', inviterName);
    }

    const longLink = loginUrl.toString();

    if (!FIREBASE_DYNAMIC_LINKS.domainUriPrefix || !FIREBASE_DYNAMIC_LINKS.shortLinksEndpoint) {
      return longLink;
    }

    try {
      const response = await axios.post(FIREBASE_DYNAMIC_LINKS.shortLinksEndpoint, {
        dynamicLinkInfo: {
          domainUriPrefix: FIREBASE_DYNAMIC_LINKS.domainUriPrefix,
          link: longLink,
          androidInfo: {
            androidPackageName: 'com.redasn.Client',
          },
          iosInfo: {
            iosBundleId: 'com.redasn.Client',
          },
        },
        suffix: {
          option: 'SHORT',
        },
      });

      return response.data?.shortLink || longLink;
    } catch (error) {
      console.warn('Failed to create Firebase Dynamic Link, falling back to long link:', error);
      return longLink;
    }
  }, []);

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

        if (!user?.id) {
          throw new Error('User information not loaded. Please try again in a moment.');
        }

        // Step 2: Create share message and invite link
        const inviterName = user.firstName || user.userName || t('invite.defaultInviterName');
        const shareMessage = t('invite.messageWithName', {
          inviterName,
        });
        const inviteUrl = await createInviteLink(user.id, inviterName);
        const shareText = `${shareMessage}\n${inviteUrl}`;

        // Step 3: Share using native Share API
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
    [createInviteLink, t, user?.firstName, user?.id, user?.userName]
  );

  return {
    inviteFriends,
    loading,
  };
};

