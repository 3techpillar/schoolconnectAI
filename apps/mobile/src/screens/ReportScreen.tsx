import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AttendanceSummary, HomeworkItem} from '@schoolconnect/shared';
import {levelFromXp} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Card, Loading, Screen} from '../components/ui';
import type {RootStackParamList} from '../navigation/types';

type EngageSnap = {xp: number; streak: number};

export function ReportScreen() {
  const {user} = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [engage, setEngage] = useState<EngageSnap | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, hw, eg] = await Promise.all([
        apiFetch<{attendance: AttendanceSummary}>('/api/attendance/summary').catch(
          () => null,
        ),
        apiFetch<{homework: HomeworkItem[]}>('/api/homework').catch(() => null),
        apiFetch<{engage: EngageSnap}>('/api/engage').catch(() => null),
      ]);
      setAttendance(a?.attendance || null);
      setHomework(hw?.homework || []);
      setEngage(eg?.engage || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;
  if (loading) return <Loading label="Loading report…" />;

  const subject =
    user.role === 'parent' ? user.childName || 'Your child' : user.name;
  const latest = user.classHistory?.[0];
  const pendingHw = homework.filter(
    h => h.status === 'pending' || h.status === 'in-progress',
  ).length;
  const xp = engage?.xp || 0;
  const streak = engage?.streak || 0;
  const history = user.classHistory || [];

  return (
    <Screen
      title="Report"
      subtitle={[subject, user.className].filter(Boolean).join(' · ')}>
      <Card>
        <Text style={styles.kicker}>Academic snapshot</Text>
        <Text style={styles.title}>{subject}</Text>
        <Text style={styles.meta}>
          {[
            user.school,
            user.className && `Class ${user.className}`,
            user.academicYear,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </Card>

      <View style={styles.grid}>
        <Pressable
          style={styles.stat}
          onPress={() => nav.navigate('Attendance')}>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={styles.statValue}>{attendance?.label || '—'}</Text>
          <Text style={styles.hint}>{attendance?.hint || 'Month view'}</Text>
        </Pressable>
        <Pressable style={styles.stat} onPress={() => nav.navigate('Progress')}>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>Lv {levelFromXp(xp)}</Text>
          <Text style={styles.hint}>
            {xp} XP · {streak}-day streak
          </Text>
        </Pressable>
        <Pressable
          style={styles.stat}
          onPress={() => nav.navigate('HomeworkTab')}>
          <Text style={styles.statLabel}>Homework</Text>
          <Text style={styles.statValue}>{pendingHw}</Text>
          <Text style={styles.hint}>Active assignments</Text>
        </Pressable>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Term result</Text>
          <Text style={[styles.statValue, styles.capitalize]}>
            {latest?.result || 'Pending'}
          </Text>
          <Text style={styles.hint}>
            {latest?.sessionLabel || 'Current session'}
            {latest?.className ? ` · ${latest.className}` : ''}
          </Text>
        </View>
      </View>

      {history.length > 1 ? (
        <>
          <Text style={styles.section}>Class history</Text>
          {history.map((row, i) => (
            <Card key={`${row.sessionId}-${i}`} style={{marginBottom: 8}}>
              <Text style={styles.histTitle}>
                {row.sessionLabel} · {row.className}
              </Text>
              <Text style={styles.meta}>
                {row.result}
                {row.promotedTo ? ` → ${row.promotedTo}` : ''}
              </Text>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {fontSize: 11, fontWeight: '700', color: theme.slate},
  title: {marginTop: 4, fontSize: 18, fontWeight: '800', color: theme.ink},
  meta: {marginTop: 6, fontSize: 12, color: theme.slate},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  stat: {
    width: '47%',
    backgroundColor: theme.white,
    borderRadius: theme.radiusCard,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
  },
  statLabel: {fontSize: 11, color: theme.slate, fontWeight: '600'},
  statValue: {marginTop: 6, fontSize: 20, fontWeight: '800', color: theme.ink},
  capitalize: {textTransform: 'capitalize'},
  hint: {marginTop: 4, fontSize: 11, color: theme.slate},
  section: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.slate,
    textTransform: 'uppercase',
  },
  histTitle: {fontWeight: '600', color: theme.ink},
});
