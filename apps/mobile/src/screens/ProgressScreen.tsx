import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {EngageMission} from '@schoolconnect/shared';
import {XP_PER_LEVEL, levelFromXp} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Card, Loading, PrimaryButton, Screen} from '../components/ui';

type EngageClient = {
  xp: number;
  streak: number;
  lastCheckInDay?: string | null;
  missions?: EngageMission[];
};

export function ProgressScreen() {
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [engage, setEngage] = useState<EngageClient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{engage: EngageClient}>('/api/engage');
      setEngage(res.engage);
    } catch {
      setEngage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    setFlash(null);
    try {
      const res = await apiFetch<{
        engage: EngageClient;
        message?: string;
      }>('/api/engage', {method: 'POST', body: JSON.stringify(body)});
      setEngage(res.engage);
      setFlash(res.message || 'Saved');
    } catch (e) {
      setFlash(e instanceof Error ? e.message : 'Could not update');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;
  if (loading) return <Loading label="Loading progress…" />;

  const xp = engage?.xp || 0;
  const level = levelFromXp(xp);
  const into = xp % XP_PER_LEVEL;
  const missions = engage?.missions || [];
  const subject =
    user.role === 'parent' ? user.childName || 'Your child' : user.name;

  return (
    <Screen title="Progress" subtitle={`${subject} · Learning Zone`}>
      <Card style={styles.hero}>
        <Text style={styles.kicker}>Level {level}</Text>
        <Text style={styles.xp}>
          {xp} XP · {engage?.streak || 0}-day streak
        </Text>
        <View style={styles.bar}>
          <View style={[styles.fill, {width: `${into}%`}]} />
        </View>
        <Text style={styles.hint}>
          {XP_PER_LEVEL - into} XP to level {level + 1}
        </Text>
        {flash ? <Text style={styles.flash}>{flash}</Text> : null}
        <PrimaryButton
          label={busy ? 'Saving…' : 'Daily check-in'}
          disabled={busy}
          onPress={() => void act({action: 'checkIn'})}
          style={{marginTop: 12}}
        />
      </Card>

      <Text style={styles.section}>Missions</Text>
      {missions.map(m => (
        <Card key={m.id} style={{marginBottom: 8}}>
          <Text style={styles.missionTitle}>{m.title}</Text>
          <Text style={styles.hint}>
            {m.hint} · +{m.xp} XP
          </Text>
          {!m.done ? (
            <PrimaryButton
              label={busy ? 'Saving…' : 'Complete'}
              disabled={busy}
              onPress={() =>
                void act({action: 'completeMission', missionId: m.id})
              }
              style={{marginTop: 10}}
            />
          ) : (
            <Text style={styles.done}>Done</Text>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {backgroundColor: theme.yellowTint, borderColor: theme.yellow},
  kicker: {fontSize: 12, fontWeight: '700', color: theme.slate},
  xp: {marginTop: 4, fontSize: 20, fontWeight: '800', color: theme.ink},
  bar: {
    marginTop: 12,
    height: 8,
    borderRadius: 99,
    backgroundColor: theme.line,
    overflow: 'hidden',
  },
  fill: {height: 8, backgroundColor: theme.orange, borderRadius: 99},
  hint: {marginTop: 6, fontSize: 12, color: theme.slate},
  flash: {marginTop: 8, color: theme.green, fontWeight: '600'},
  section: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.slate,
    textTransform: 'uppercase',
  },
  missionTitle: {fontWeight: '700', color: theme.ink},
  done: {marginTop: 8, color: theme.green, fontWeight: '700'},
});
