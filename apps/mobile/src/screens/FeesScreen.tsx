import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import type {FeesPayload} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {Card, EmptyState, Loading, PrimaryButton, Screen} from '../components/ui';

export function FeesScreen() {
  const [fees, setFees] = useState<FeesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{fees: FeesPayload}>('/api/fees');
      setFees(res.fees);
    } catch {
      setFees(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pay = async () => {
    setPaying(true);
    setFlash(null);
    try {
      const res = await apiFetch<{fees: FeesPayload; alreadyPaid?: boolean}>(
        '/api/fees',
        {method: 'POST', body: '{}'},
      );
      setFees(res.fees);
      setFlash(res.alreadyPaid ? 'Already paid' : 'Payment recorded');
    } catch (e) {
      setFlash(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Loading label="Loading fees…" />;
  if (!fees) {
    return (
      <Screen title="Fees">
        <EmptyState title="No fee ledger" body="Fees appear after school setup." />
      </Screen>
    );
  }

  const due = (fees.outstandingPaise || 0) > 0;

  return (
    <Screen title="Fees" subtitle={fees.termLabel}>
      <Card>
        <Text style={styles.label}>Outstanding</Text>
        <Text style={styles.amount}>{fees.outstanding}</Text>
        <Text style={styles.meta}>
          Due {fees.dueDateLabel}
          {fees.overdue ? ' · Overdue' : ''}
        </Text>
        <PrimaryButton
          label={paying ? 'Paying…' : due ? 'Pay now' : 'Paid'}
          disabled={paying || !due}
          onPress={() => void pay()}
          style={{marginTop: 12}}
        />
        {flash ? <Text style={styles.flash}>{flash}</Text> : null}
      </Card>
      <Text style={styles.section}>History</Text>
      {fees.history.map((h, i) => (
        <Card key={`${h.title}-${i}`} style={{marginBottom: 8}}>
          <Text style={styles.histTitle}>{h.title}</Text>
          <Text style={styles.meta}>
            {h.date} · {h.amount}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 12, color: theme.slate, fontWeight: '600'},
  amount: {fontSize: 28, fontWeight: '800', color: theme.ink, marginTop: 4},
  meta: {fontSize: 12, color: theme.slate, marginTop: 4},
  flash: {marginTop: 8, color: theme.green, fontWeight: '600'},
  section: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.slate,
    textTransform: 'uppercase',
  },
  histTitle: {fontWeight: '600', color: theme.ink},
});
