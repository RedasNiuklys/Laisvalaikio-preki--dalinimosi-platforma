import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export interface UserReputation {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  completedBookingsCount?: number;
  lentOutCount?: number;
  averageRatingAsOwner?: number;
  memberSince?: string;
}

interface UserProfileCardProps {
  user: UserReputation;
  showReputation?: boolean;
}

export default function UserProfileCard({ user, showReputation = true }: UserProfileCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = user.memberSince
    ? new Date(user.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant, borderRadius: 12 }]}>
      <View style={styles.top}>
        {user.avatarUrl ? (
          <Avatar.Image size={56} source={{ uri: user.avatarUrl }} />
        ) : (
          <Avatar.Text size={56} label={initials} style={{ backgroundColor: theme.colors.primary }} />
        )}
        <View style={styles.nameCol}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
            {displayName}
          </Text>
          {formattedDate && (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('profile.memberSince', { date: formattedDate })}
            </Text>
          )}
        </View>
      </View>

      {showReputation && (
        <View style={styles.stats}>
          {(user.averageRatingAsOwner ?? 0) > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="star" size={16} color="#f9a825" />
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface, marginLeft: 4 }}>
                {user.averageRatingAsOwner?.toFixed(1)}
              </Text>
            </View>
          )}
          {(user.lentOutCount ?? 0) > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="cube-send" size={16} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                {t('profile.lentOut', { count: user.lentOutCount })}
              </Text>
            </View>
          )}
          {(user.completedBookingsCount ?? 0) > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.secondary} />
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                {t('profile.completedRentals', { count: user.completedBookingsCount })}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 8,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameCol: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
