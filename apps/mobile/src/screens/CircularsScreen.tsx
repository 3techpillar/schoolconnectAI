import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {apiFetch, theme} from '../api';
import {Card, EmptyState, Loading, Screen} from '../components/ui';

type Circular = {
  id: string;
  title: string;
  body: string;
  tag?: string;
  createdAt?: number;
  unread?: boolean;
};

export function CircularsScreen() {
  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Class desk payload includes circulars for family feeds on web;
      // fall back to notifications of type circular when needed.
      const desk = await apiFetch<{circulars?: Circular[]}>('/api/class-desk').catch(
        () => null,
      );
      if (desk?.circulars?.length) {
        setItems(desk.circulars);
        return;
      }
      const notifs = await apiFetch<{
        notifications: Array<{
          id: string;
          title: string;
          body: string;
          type: string;
          createdAt: number;
          read: boolean;
        }>;
      }>('/api/notifications');
      setItems(
        (notifs.notifications || [])
          .filter(n => n.type === 'circular')
          .map(n => ({
            id: n.id,
            title: n.title,
            body: n.body,
            createdAt: n.createdAt,
            unread: !n.read,
            tag: 'Notice',
          })),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading label="Loading circulars…" />;

  return (
    <Screen title="Circulars" subtitle="School updates">
      {!items.length ? (
        <EmptyState title="No circulars yet" body="Official notices appear here." />
      ) : (
        items.map(c => (
          <Card key={c.id} style={{marginBottom: 10}}>
            {c.tag ? <Text style={styles.tag}>{c.tag}</Text> : null}
            <Text style={styles.title}>{c.title}</Text>
            <Text style={styles.body}>{c.body}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '700',
    color: theme.blue,
    backgroundColor: theme.blueTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  title: {fontWeight: '700', color: theme.ink, fontSize: 15},
  body: {marginTop: 6, fontSize: 13, color: theme.slate, lineHeight: 18},
});
