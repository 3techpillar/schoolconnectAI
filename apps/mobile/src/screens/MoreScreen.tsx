import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Screen} from '../components/ui';
import type {RootStackParamList} from '../navigation/types';

const ALL_LINKS: Array<{
  label: string;
  route: keyof RootStackParamList;
  module?: 'fees' | 'bus' | 'attendance' | 'circulars' | 'notifications';
}> = [
  {label: 'Fees', route: 'Fees', module: 'fees'},
  {label: 'Attendance', route: 'Attendance', module: 'attendance'},
  {label: 'Report', route: 'Report'},
  {label: 'Progress', route: 'Progress'},
  {label: 'Circulars', route: 'Circulars', module: 'circulars'},
  {label: 'Notifications', route: 'Notifications', module: 'notifications'},
  {label: 'Bus', route: 'Bus', module: 'bus'},
  {label: 'Profile', route: 'Profile'},
];

export function MoreScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {user} = useAuth();

  const links = useMemo(() => {
    const caps = user?.capabilities;
    return ALL_LINKS.filter(item => {
      if (!item.module) return true;
      // Default-on Connect modules stay visible when caps missing (offline).
      if (item.module === 'fees') return Boolean(caps?.fees);
      if (caps && caps[item.module] === false) return false;
      return true;
    });
  }, [user?.capabilities]);

  return (
    <Screen title="More" subtitle="Family tools">
      <View style={styles.list}>
        {links.map(item => (
          <Pressable
            key={item.route}
            style={styles.row}
            onPress={() => nav.navigate(item.route as never)}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusCard,
    borderWidth: 1,
    borderColor: theme.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  label: {fontSize: 15, fontWeight: '600', color: theme.ink},
  chev: {fontSize: 18, color: theme.slate},
});
