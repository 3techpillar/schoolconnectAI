import React, {type ReactNode} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../api';

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  right,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  right?: ReactNode;
}) {
  const body = (
    <View style={styles.inner}>
      {(title || subtitle || right) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, disabled && styles.btnDisabled, style]}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

export function Card({children, style}: {children: ReactNode; style?: ViewStyle}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function EmptyState({title, body}: {title: string; body?: string}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function Loading({label = 'Loading…'}: {label?: string}) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.blue} />
      <Text style={styles.subtitle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: theme.paper},
  scroll: {paddingBottom: 32},
  inner: {paddingHorizontal: 16, paddingTop: 8, gap: 12},
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  headerText: {flex: 1, gap: 2},
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.ink,
  },
  subtitle: {fontSize: 13, color: theme.slate},
  btn: {
    backgroundColor: theme.blue,
    borderRadius: theme.radiusBtn,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {opacity: 0.5},
  btnText: {color: theme.white, fontWeight: '700', fontSize: 15},
  card: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusCard,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 14,
  },
  empty: {alignItems: 'center', paddingVertical: 40, gap: 6},
  emptyTitle: {fontWeight: '700', color: theme.ink},
  emptyBody: {fontSize: 13, color: theme.slate, textAlign: 'center'},
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
});
