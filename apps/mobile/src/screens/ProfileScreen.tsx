import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {ROLE_LABEL, type ParentAccess} from '@schoolconnect/shared';
import {theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Card, PrimaryButton, Screen} from '../components/ui';

export function ProfileScreen() {
  const {user, logout, updateProfile} = useAuth();
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  if (!user) return null;

  const access: ParentAccess =
    user.parentAccess === 'student' ? 'student' : 'guardian';

  const setAccess = async (parentAccess: ParentAccess) => {
    if (parentAccess === access) return;
    setSaving(true);
    setFlash(null);
    try {
      await updateProfile({parentAccess});
      setFlash(
        parentAccess === 'guardian'
          ? 'Guardian view on — attendance, report and progress stay on top.'
          : 'Student view on — same home as the child app.',
      );
    } catch (e) {
      setFlash(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Profile" subtitle={ROLE_LABEL[user.role]}>
      <Card>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>{user.identifier}</Text>
        <Text style={styles.meta}>
          {[user.school, user.className && `Class ${user.className}`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {user.childName ? (
          <Text style={styles.meta}>Child: {user.childName}</Text>
        ) : null}
      </Card>

      {user.role === 'parent' ? (
        <Card>
          <Text style={styles.section}>How you use the app</Text>
          <Pressable
            style={[styles.choice, access === 'guardian' && styles.choiceOn]}
            disabled={saving}
            onPress={() => void setAccess('guardian')}>
            <Text style={styles.choiceTitle}>Guardian view</Text>
            <Text style={styles.choiceBody}>
              Attendance, report and progress stay on top. Same chats, homework
              and Learning Zone as your child.
            </Text>
          </Pressable>
          <Pressable
            style={[styles.choice, access === 'student' && styles.choiceOn]}
            disabled={saving}
            onPress={() => void setAccess('student')}>
            <Text style={styles.choiceTitle}>Student view</Text>
            <Text style={styles.choiceBody}>
              Same home as the student account (Zone first). Use this if you
              only want to follow the child app.
            </Text>
          </Pressable>
          {flash ? <Text style={styles.flash}>{flash}</Text> : null}
        </Card>
      ) : null}

      <PrimaryButton
        label="Sign out"
        onPress={() => void logout()}
        style={{backgroundColor: theme.slate}}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {fontSize: 18, fontWeight: '800', color: theme.ink},
  meta: {marginTop: 6, fontSize: 13, color: theme.slate},
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.slate,
    marginBottom: 10,
  },
  choice: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusCard,
    padding: 12,
    marginBottom: 8,
  },
  choiceOn: {
    borderColor: theme.blue,
    backgroundColor: theme.blueTint,
  },
  choiceTitle: {fontSize: 14, fontWeight: '700', color: theme.ink},
  choiceBody: {marginTop: 4, fontSize: 12, color: theme.slate, lineHeight: 17},
  flash: {marginTop: 4, fontSize: 12, color: theme.green, fontWeight: '600'},
});
