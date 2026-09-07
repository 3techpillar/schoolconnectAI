import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ChatThread} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {EmptyState, Loading, Screen} from '../components/ui';
import type {RootStackParamList} from '../navigation/types';

export function ChatsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{chats: ChatThread[]}>('/api/chats');
      setChats(res.chats || []);
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading label="Loading messages…" />;

  return (
    <Screen title="Messages" subtitle="School messaging" scroll={false}>
      <FlatList
        data={chats}
        keyExtractor={c => c.id}
        contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 24}}
        ListEmptyComponent={
          <EmptyState title="No chats yet" body="Class threads appear after sync." />
        }
        renderItem={({item}) => (
          <Pressable
            style={styles.row}
            onPress={() => nav.navigate('ChatThread', {id: item.id, title: item.title})}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.avatar || item.title.slice(0, 2)}</Text>
            </View>
            <View style={styles.grow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
            {item.unread > 0 ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.unread}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: theme.white, fontWeight: '700', fontSize: 12},
  grow: {flex: 1},
  title: {fontWeight: '700', color: theme.ink},
  sub: {fontSize: 12, color: theme.slate, marginTop: 2},
  pill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pillText: {color: theme.white, fontSize: 11, fontWeight: '700'},
});
