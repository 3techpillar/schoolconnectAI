import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import type {AttendanceSummary} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {Card, Loading, Screen} from '../components/ui';

export function AttendanceScreen() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{attendance: AttendanceSummary}>(
        '/api/attendance/summary',
      );
      setSummary(res.attendance);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading label="Loading attendance…" />;

  return (
    <Screen title="Attendance" subtitle="Trust view">
      <Card>
        <Text style={styles.label}>This period</Text>
        <Text style={styles.value}>{summary?.label || '—'}</Text>
        <Text style={styles.hint}>{summary?.hint || 'No marks yet'}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 12, color: theme.slate, fontWeight: '600'},
  value: {fontSize: 32, fontWeight: '800', color: theme.green, marginTop: 4},
  hint: {marginTop: 6, fontSize: 13, color: theme.slate},
});
