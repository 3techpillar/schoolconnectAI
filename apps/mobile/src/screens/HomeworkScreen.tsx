import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {HomeworkItem} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {Card, EmptyState, Loading, Screen} from '../components/ui';

export function HomeworkScreen() {
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{homework: HomeworkItem[]}>('/api/homework');
      setItems(res.homework || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading label="Loading homework…" />;

  return (
    <Screen title="Homework" subtitle="Assignments">
      {!items.length ? (
        <EmptyState title="No homework yet" body="New assignments will show here." />
      ) : (
        items.map(h => (
          <Card key={h.id} style={{marginBottom: 10}}>
            <View style={styles.row}>
              <Text style={styles.pill}>{h.subject}</Text>
              <Text style={styles.due}>{h.due}</Text>
            </View>
            <Text style={styles.title}>{h.title}</Text>
            <Text style={styles.meta}>
              {h.status} · {h.priority} · {h.postedBy}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
  pill: {
    backgroundColor: theme.blueTint,
    color: theme.blue,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  due: {fontSize: 11, color: theme.orange, fontWeight: '600'},
  title: {fontSize: 15, fontWeight: '700', color: theme.ink},
  meta: {marginTop: 6, fontSize: 12, color: theme.slate, textTransform: 'capitalize'},
});
