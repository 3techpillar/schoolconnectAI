import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {ROLE_LABEL} from '@schoolconnect/shared';
import {theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Card, PrimaryButton, Screen} from '../components/ui';

export function PendingScreen() {
  const {user, needsSchool, logout, refreshUser} = useAuth();

  return (
    <Screen
      title={needsSchool ? 'School required' : 'Awaiting approval'}
      subtitle={user ? ROLE_LABEL[user.role] : undefined}>
      <Card>
        <Text style={styles.title}>
          {needsSchool
            ? 'No school linked to this account'
            : 'Your enrollment is pending'}
        </Text>
        <Text style={styles.body}>
          {needsSchool
            ? 'Ask your school admin to assign a school, then pull to refresh.'
            : 'A class teacher or admin will approve access shortly.'}
        </Text>
        {user?.school ? (
          <Text style={styles.meta}>School: {user.school}</Text>
        ) : null}
        <PrimaryButton
          label="Refresh status"
          onPress={() => void refreshUser()}
          style={{marginTop: 12}}
        />
        <PrimaryButton
          label="Sign out"
          onPress={() => void logout()}
          style={{marginTop: 8, backgroundColor: theme.slate}}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 16, fontWeight: '700', color: theme.ink, marginBottom: 8},
  body: {fontSize: 13, color: theme.slate, lineHeight: 18},
  meta: {marginTop: 10, fontSize: 12, color: theme.teal, fontWeight: '600'},
});
