import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { getXpLevel } from '@/utils';

interface XPRingCardProps {
  xp: number;
  goalColor: string;
}

export function XPRingCard({ xp, goalColor }: XPRingCardProps) {
  const { colors } = useThemeStore();
  const { level, title, nextLevelXp } = getXpLevel(xp);
  const progress = Math.min(1, xp / nextLevelXp);

  // Animated bar width (0–100%)
  const barWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: progress * 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [xp]);

  const widthInterp = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        {/* Level badge */}
        <View style={[styles.badge, { backgroundColor: `${goalColor}22` }]}>
          <Text style={[styles.badgeLevel, { color: goalColor }]}>Lv.{level}</Text>
          <Text style={[styles.badgeTitle, { color: goalColor }]}>{title}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.xpRow}>
            <Text style={[styles.xpValue, { color: colors.text }]}>
              {xp.toLocaleString()} XP
            </Text>
            <Text style={[styles.xpMax, { color: colors.textMuted }]}>
              / {nextLevelXp.toLocaleString()}
            </Text>
          </View>
          <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>
            {nextLevelXp - xp > 0 ? `${(nextLevelXp - xp).toLocaleString()} XP to next level` : 'Max level reached!'}
          </Text>

          {/* Animated bar */}
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[styles.fill, { backgroundColor: goalColor, width: widthInterp }]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeLevel: { fontSize: 18, fontWeight: '900' },
  badgeTitle: { fontSize: 10, fontWeight: '700' },
  info: { flex: 1 },
  xpRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 2 },
  xpValue: { fontSize: 20, fontWeight: '800' },
  xpMax: { fontSize: 13 },
  xpLabel: { fontSize: 12, marginBottom: 10 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
