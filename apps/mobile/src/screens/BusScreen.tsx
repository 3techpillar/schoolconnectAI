import React, {useCallback, useEffect, useState} from 'react';
import {Linking, StyleSheet, Text} from 'react-native';
import {apiFetch, theme} from '../api';
import {Card, Loading, PrimaryButton, Screen} from '../components/ui';

type BusPayload = {
  progress?: number;
  route?: {
    name?: string;
    stops?: Array<{id: string; shortName: string; name: string}>;
  };
};

export function BusScreen() {
  const [bus, setBus] = useState<BusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<BusPayload>('/api/bus');
      setBus(res);
    } catch {
      setBus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading label="Loading live bus…" />;

  const pct = Math.round((bus?.progress || 0) * 100);
  const home = bus?.route?.stops?.[2] || bus?.route?.stops?.[0];
  const phone = '+919876543210';

  return (
    <Screen title="Bus" subtitle={bus?.route?.name || 'Live track'}>
      <Card>
        <Text style={styles.label}>Trip progress</Text>
        <Text style={styles.eta}>{pct}%</Text>
        <Text style={styles.meta}>
          Home stop · {home?.shortName || home?.name || '—'}
        </Text>
        <PrimaryButton
          label="Call driver"
          onPress={() => void Linking.openURL(`tel:${phone}`)}
          style={{marginTop: 12}}
        />
        <PrimaryButton
          label="Refresh"
          onPress={() => void load()}
          style={{marginTop: 8, backgroundColor: theme.teal}}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 12, color: theme.slate, fontWeight: '600'},
  eta: {fontSize: 36, fontWeight: '800', color: theme.blue, marginTop: 4},
  meta: {marginTop: 6, fontSize: 13, color: theme.slate},
});
