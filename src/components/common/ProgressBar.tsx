import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color,
  height = 8,
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const { colors } = useThemeStore();
  const barColor = color ?? colors.primary;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
          {showLabel && (
            <Text style={[styles.percent, { color: colors.text }]}>{clampedProgress}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { backgroundColor: colors.border, height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              height,
              width: widthInterpolated,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { fontSize: 13 },
  percent: { fontSize: 13, fontWeight: '600' },
});
