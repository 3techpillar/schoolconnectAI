import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {
  AttendanceSummary,
  ChatThread,
  EngageMission,
  FeedItem,
  FeesPayload,
} from '@schoolconnect/shared';
import {
  levelFromXp,
  usesGuardianFamilySurface,
  usesStudentFamilySurface,
} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Card, Loading, Screen} from '../components/ui';
import type {RootStackParamList} from '../navigation/types';

type EngageSnap = {
  xp: number;
  streak: number;
  missions?: EngageMission[];
};

export function HomeScreen() {
  const {user} = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<FeesPayload | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [homeworkLabel, setHomeworkLabel] = useState('—');
  const [chatCount, setChatCount] = useState(0);
  const [engage, setEngage] = useState<EngageSnap | null>(null);
  const [busProgress, setBusProgress] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, a, fd, ch, eg, b] = await Promise.all([
        apiFetch<{fees: FeesPayload}>('/api/fees').catch(() => null),
        apiFetch<{attendance: AttendanceSummary}>('/api/attendance/summary').catch(
          () => null,
        ),
        apiFetch<{
          feed: FeedItem[];
          homework?: {label: string; hint: string};
        }>('/api/feed').catch(() => null),
        apiFetch<{chats: ChatThread[]}>('/api/chats').catch(() => null),
        apiFetch<{engage: EngageSnap}>('/api/engage').catch(() => null),
        apiFetch<{progress?: number}>('/api/bus').catch(() => null),
      ]);
      setFees(f?.fees || null);
      setAttendance(a?.attendance || null);
      setFeed(fd?.feed || []);
      setHomeworkLabel(fd?.homework?.label || '—');
      setChatCount(ch?.chats?.length || 0);
      setEngage(eg?.engage || null);
      setBusProgress(
        typeof b?.progress === 'number' ? b.progress : null,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;
  if (loading) return <Loading label="Loading your day…" />;

  const guardianSurface = usesGuardianFamilySurface(user);
  const studentSurface = usesStudentFamilySurface(user);
  const first = user.name.split(' ')[0];
  const title =
    user.role === 'parent' && user.childName
      ? `${user.childName.split(' ')[0]}'s day`
      : `Hey ${first}`;
  const xp = engage?.xp || 0;
  const streak = engage?.streak || 0;
  const level = levelFromXp(xp);
  const missionsLeft = (engage?.missions || []).filter(m => !m.done).length;
  const latest = user.classHistory?.[0];
  const reportValue = latest?.result
    ? latest.result === 'pending'
      ? 'In term'
      : latest.result
    : 'View';

  const stats: Array<{
    label: string;
    value: string;
    href: keyof RootStackParamList | 'ChatsTab' | 'HomeworkTab';
  }> = [
    ...(guardianSurface
      ? []
      : [
          {
            label: 'Attendance',
            value: attendance?.label || '—',
            href: 'Attendance' as const,
          },
        ]),
    ...(user.capabilities?.fees
      ? [
          {
            label: 'Fees due',
            value: fees?.outstanding || '—',
            href: 'Fees' as const,
          },
        ]
      : []),
    {label: 'Chats', value: chatCount ? String(chatCount) : '0', href: 'ChatsTab'},
    {label: 'Homework', value: homeworkLabel, href: 'HomeworkTab'},
    ...(user.capabilities?.bus === false
      ? []
      : [
          {
            label: 'Bus',
            value:
              busProgress == null
                ? 'Live'
                : `${Math.round(busProgress * 100)}%`,
            href: 'Bus' as const,
          },
        ]),
  ];

  return (
    <Screen
      title={title}
      subtitle={[user.school, user.className].filter(Boolean).join(' · ')}>
      {studentSurface ? (
        <Pressable onPress={() => nav.navigate('Progress')}>
          <Card style={styles.zoneCard}>
            <Text style={styles.heroKicker}>Learning Zone</Text>
            <Text style={styles.heroTitle}>
              {xp} XP · Lv {level}
            </Text>
            <Text style={styles.feedMeta}>
              {missionsLeft > 0
                ? `${missionsLeft} missions waiting · ${streak}-day streak`
                : `All missions done · ${streak}-day streak`}
            </Text>
          </Card>
        </Pressable>
      ) : guardianSurface ? (
        <Card>
          <Text style={styles.heroKicker}>Parent view</Text>
          <Text style={styles.heroTitle}>
            {(user.childName || 'Your child').split(' ')[0]}'s school day
          </Text>
          <Text style={styles.feedMeta}>
            Same tools as your child — attendance, report and progress stay on
            top.
          </Text>
        </Card>
      ) : null}

      {user.capabilities?.bus === false ? null : (
        <Pressable onPress={() => nav.navigate('Bus')}>
          <Card style={styles.busCard}>
            <Text style={styles.heroKicker}>Live bus tracking</Text>
            <Text style={styles.heroTitle}>
              {busProgress == null
                ? 'Open map'
                : `${Math.round(busProgress * 100)}% of trip`}
            </Text>
            <Text style={styles.feedMeta}>
              ETA, stops and driver — tap to track
            </Text>
          </Card>
        </Pressable>
      )}

      {guardianSurface ? (
        <View style={styles.trustRow}>
          {[
            {
              label: 'Attendance',
              value: attendance?.label || '—',
              hint: attendance?.hint || 'This month',
              href: 'Attendance' as const,
              tone: 'green' as const,
            },
            {
              label: 'Report',
              value: reportValue,
              hint: latest?.sessionLabel || 'This year',
              href: 'Report' as const,
              tone: 'blue' as const,
            },
            {
              label: 'Progress',
              value: `Lv ${level}`,
              hint: `${xp} XP · ${streak}-day streak`,
              href: 'Progress' as const,
              tone: 'yellow' as const,
            },
          ].map(item => (
            <Pressable
              key={item.label}
              style={[styles.trustCard, trustTone[item.tone]]}
              onPress={() => nav.navigate(item.href)}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.trustValue}>{item.value}</Text>
              <Text style={styles.trustHint} numberOfLines={2}>
                {item.hint}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.grid}>
        {stats.map(item => (
          <Pressable
            key={item.label}
            style={styles.stat}
            onPress={() => {
              nav.navigate(item.href as never);
            }}>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>
        {studentSurface ? 'Your day' : 'Recent'}
      </Text>
      {feed.slice(0, 6).map(item => (
        <Card key={item.id} style={{marginBottom: 8}}>
          <Text style={styles.feedTitle}>{item.title}</Text>
          <Text style={styles.feedMeta}>{item.meta}</Text>
        </Card>
      ))}
      {!feed.length ? (
        <Card>
          <Text style={styles.feedMeta}>
            No recent updates yet. Class homework and circulars will show here.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const trustTone = {
  green: {borderColor: theme.green, backgroundColor: theme.greenTint},
  blue: {borderColor: theme.blue, backgroundColor: theme.blueTint},
  yellow: {borderColor: theme.yellow, backgroundColor: theme.yellowTint},
};

const styles = StyleSheet.create({
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
  statValue: {marginTop: 6, fontSize: 18, fontWeight: '700', color: theme.ink},
  section: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: theme.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroKicker: {fontSize: 11, fontWeight: '700', color: theme.blue},
  heroTitle: {marginTop: 4, fontSize: 16, fontWeight: '700', color: theme.ink},
  feedTitle: {fontWeight: '600', color: theme.ink},
  feedMeta: {marginTop: 4, fontSize: 12, color: theme.slate},
  zoneCard: {backgroundColor: theme.yellowTint, borderColor: theme.yellow},
  busCard: {backgroundColor: theme.blueTint, borderColor: theme.blue},
  trustRow: {flexDirection: 'row', gap: 8},
  trustCard: {
    flex: 1,
    borderRadius: theme.radiusCard,
    borderWidth: 1.5,
    padding: 10,
    minHeight: 108,
  },
  trustValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '800',
    color: theme.ink,
    textTransform: 'capitalize',
  },
  trustHint: {marginTop: 2, fontSize: 10, color: theme.slate},
});
