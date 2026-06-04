import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NotificationItem } from '../api/notificationApi';

interface NotificationCardProps {
  item: NotificationItem;
  onPress?: () => void;
}

const iconByType: Record<string, string> = {
  Booking: 'calendar-check',
  Chat: 'chat',
  System: 'bell',
};

export default function NotificationCard({ item, onPress }: NotificationCardProps) {
  const theme = useTheme();
  const icon = iconByType[item.type] ?? 'bell';
  const timeAgo = formatTimeAgo(item.createdAt);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        !item.isRead && { borderLeftColor: theme.colors.primary, borderLeftWidth: 3 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={24}
        color={item.isRead ? theme.colors.onSurfaceVariant : theme.colors.primary}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.onSurface, fontWeight: item.isRead ? '400' : '700' }}
        >
          {item.title}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2}>
          {item.body}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
          {timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
});
