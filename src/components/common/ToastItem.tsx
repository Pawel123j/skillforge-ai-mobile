import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

export type ToastType = 'xp' | 'achievement' | 'streak' | 'success' | 'warning' | 'error';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItemProps {
  config: ToastConfig;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<ToastType, string> = {
  xp:          '⭐',
  achievement: '🏆',
  streak:      '🔥',
  success:     '✅',
  warning:     '⚠️',
  error:       '❌',
};

const TOAST_COLORS: Record<ToastType, string> = {
  xp:          '#6366F1',
  achievement: '#8B5CF6',
  streak:      '#F59E0B',
  success:     '#10B981',
  warning:     '#F59E0B',
  error:       '#EF4444',
};

export function ToastItem({ config, onDismiss }: ToastItemProps) {
  const { colors } = useThemeStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const color = TOAST_COLORS[config.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss(config.id));
    }, config.duration ?? 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.card,
          borderColor: `${color}44`,
          borderLeftColor: color,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={() => onDismiss(config.id)}
        activeOpacity={0.9}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
          <Text style={styles.icon}>{TOAST_ICONS[config.type]}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
          {config.message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{config.message}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  message: { fontSize: 12, marginTop: 1 },
});
