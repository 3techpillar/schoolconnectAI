import React, {useCallback, useEffect, useState} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import type {RouteProp} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import type {ChatMessage} from '@schoolconnect/shared';
import {apiFetch, theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {EmptyState, Loading, Screen} from '../components/ui';
import type {RootStackParamList} from '../navigation/types';

export function ChatThreadScreen() {
  const {user} = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'ChatThread'>>();
  const {id, title} = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{messages: ChatMessage[]}>(`/api/chats/${id}`);
      setMessages(res.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      const res = await apiFetch<{message?: ChatMessage; messages?: ChatMessage[]}>(
        `/api/chats/${id}`,
        {
          method: 'POST',
          body: JSON.stringify({text: body, kind: 'text'}),
        },
      );
      if (res.message) setMessages(prev => [...prev, res.message!]);
      else await load();
    } catch {
      setText(body);
    }
  };

  if (loading) return <Loading label="Opening chat…" />;

  return (
    <Screen title={title} scroll={false}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}>
        <FlatList
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{padding: 16, gap: 8, flexGrow: 1}}
          ListEmptyComponent={
            <EmptyState title="No messages yet" body="Say hello to start." />
          }
          renderItem={({item}) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                {!mine ? (
                  <Text style={styles.sender}>{item.senderName}</Text>
                ) : null}
                <Text style={[styles.text, mine && styles.textMine]}>{item.text}</Text>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={theme.slate}
          />
          <Pressable style={styles.send} onPress={() => void send()}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mine: {alignSelf: 'flex-end', backgroundColor: theme.blue},
  theirs: {alignSelf: 'flex-start', backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line},
  sender: {fontSize: 11, color: theme.teal, fontWeight: '700', marginBottom: 2},
  text: {color: theme.ink, fontSize: 14, lineHeight: 20},
  textMine: {color: theme.white},
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    backgroundColor: theme.white,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.ink,
  },
  send: {
    backgroundColor: theme.teal,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendText: {color: theme.white, fontWeight: '700'},
});
