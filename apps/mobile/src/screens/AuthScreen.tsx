import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import {SIGNUP_ROLES, DEMO_SCHOOL_GROUPS, type Role} from '@schoolconnect/shared';
import {appConfig, theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Card, PrimaryButton, Screen} from '../components/ui';

export function AuthScreen() {
  const {sendOtp, verifyOtp, completeRegistration, backend} = useAuth();
  const [step, setStep] = useState<'id' | 'otp' | 'register'>('id');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(appConfig.demoOtp);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('Green Valley Public School');
  const [role, setRole] = useState<Role>('parent');
  const [childName, setChildName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendOtp(identifier.trim());
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOtp(identifier.trim(), otp.trim());
      if (!res.existing) setStep('register');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async () => {
    setBusy(true);
    setError(null);
    try {
      await completeRegistration({
        identifier: identifier.trim(),
        name: name.trim(),
        role,
        school: school.trim(),
        childName: role === 'parent' ? childName.trim() : undefined,
        className: '6-B',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="SchoolConnect" subtitle="WhatsApp-first school app">
      {!backend ? (
        <Card>
          <Text style={styles.warn}>
            API unreachable. Set API_BASE_URL and ensure Mongo-backed API is up.
          </Text>
        </Card>
      ) : null}

      {step === 'id' && (
        <Card>
          <Text style={styles.label}>Phone or email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="parent@demo.com"
            placeholderTextColor={theme.slate}
          />
          <PrimaryButton
            label={busy ? 'Sending…' : 'Send OTP'}
            disabled={busy || identifier.trim().length < 3}
            onPress={() => void onSend()}
          />
          <Text style={styles.demoHeading}>Family demo logins</Text>
          <Text style={styles.hint}>OTP is always {appConfig.demoOtp}</Text>
          {DEMO_SCHOOL_GROUPS.filter(g =>
            g.accounts.some(a => a.family),
          ).map(group => (
            <View key={group.key} style={styles.demoGroup}>
              <Text style={styles.demoGroupTitle}>{group.label}</Text>
              <View style={styles.roles}>
                {group.accounts
                  .filter(a => a.family)
                  .map(acc => (
                    <Pressable
                      key={acc.identifier}
                      onPress={() => setIdentifier(acc.identifier)}
                      style={[
                        styles.chip,
                        identifier === acc.identifier && styles.chipOn,
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          identifier === acc.identifier && styles.chipTextOn,
                        ]}>
                        {acc.role === 'parent' ? 'Parent' : 'Student'}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          ))}
        </Card>
      )}

      {step === 'otp' && (
        <Card>
          <Text style={styles.label}>Enter OTP</Text>
          <Text style={styles.hint}>
            Demo code: {appConfig.demoOtp}
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            placeholder="000000"
            placeholderTextColor={theme.slate}
          />
          <PrimaryButton
            label={busy ? 'Verifying…' : 'Verify'}
            disabled={busy || otp.trim().length < 4}
            onPress={() => void onVerify()}
          />
        </Card>
      )}

      {step === 'register' && (
        <Card>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={theme.slate}
          />
          <Text style={styles.label}>School</Text>
          <TextInput
            style={styles.input}
            value={school}
            onChangeText={setSchool}
            placeholderTextColor={theme.slate}
          />
          {role === 'parent' ? (
            <>
              <Text style={styles.label}>Child name</Text>
              <TextInput
                style={styles.input}
                value={childName}
                onChangeText={setChildName}
                placeholderTextColor={theme.slate}
              />
            </>
          ) : null}
          <Text style={styles.label}>Role</Text>
          <View style={styles.roles}>
            {SIGNUP_ROLES.filter(r =>
              ['parent', 'student'].includes(r),
            ).map(r => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.chip, role === r && styles.chipOn]}>
                <Text style={[styles.chipText, role === r && styles.chipTextOn]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton
            label={busy ? 'Creating…' : 'Create account'}
            disabled={busy || !name.trim()}
            onPress={() => void onRegister()}
          />
        </Card>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 12, fontWeight: '600', color: theme.slate, marginBottom: 6},
  hint: {fontSize: 12, color: theme.teal, marginBottom: 8},
  demoHeading: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '700',
    color: theme.ink,
    marginBottom: 4,
  },
  demoGroup: {marginBottom: 8},
  demoGroupTitle: {fontSize: 11, fontWeight: '700', color: theme.slate, marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusBtn,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    color: theme.ink,
    backgroundColor: theme.white,
  },
  roles: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  chip: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusChip,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {backgroundColor: theme.blueTint, borderColor: theme.blue},
  chipText: {color: theme.slate},
  chipTextOn: {color: theme.blue, fontWeight: '700'},
  error: {color: theme.danger, fontSize: 13},
  warn: {color: theme.orange, fontSize: 13, lineHeight: 18},
});
