import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import NotificationCard from '@/src/components/NotificationCard';
import { getNotifications, markAllAsRead, NotificationItem } from '@/src/api/notificationApi';
import { showToast } from '@/src/components/Toast';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const data = await getNotifications(p);
      setItems(prev => p === 1 ? data.items : [...prev, ...data.items]);
      setTotal(data.total);
      setPage(p);
      // Mark all as read on open
      if (p === 1) await markAllAsRead();
    } catch {
      showToast('error', t('common.errors.unknown'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => { load(1); }, [load]);

  const loadMore = () => {
    if (items.length < total) load(page + 1);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <NotificationCard item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, true)} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('notificationCenter.empty')}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
      />
    </View>
  );
}
