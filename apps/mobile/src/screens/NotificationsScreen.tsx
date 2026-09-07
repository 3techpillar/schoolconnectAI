import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import type {AppNotification} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {Card, EmptyState, Loading, Screen} from '../components/ui';

export function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{notifications: AppNotification[]}>(
        '/api/notifications',
      );
      setItems(res.notifications || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markAll = async () => {
    await apiFetch('/api/notifications/read-all', {method: 'POST', body: '{}'});
    await load();
  };

  if (loading) return <Loading label="Loading alerts…" />;

  return (
    <Screen
      title="Notifications"
      subtitle="Alerts"
      right={
        items.some(n => !n.read) ? (
          <Pressable onPress={() => void markAll()}>
            <Text style={styles.link}>Mark all read</Text>
          </Pressable>
        ) : null
      }>
      {!items.length ? (
        <EmptyState
          title="No notifications yet"
          body="School circulars and class updates appear here."
        />
      ) : (
        items.map(n => (
          <Card key={n.id} style={{marginBottom: 8, opacity: n.read ? 0.7 : 1}}>
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.body}>{n.body}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: {color: theme.blue, fontWeight: '700', fontSize: 12},
  title: {fontWeight: '700', color: theme.ink},
  body: {marginTop: 4, fontSize: 12, color: theme.slate},
});
