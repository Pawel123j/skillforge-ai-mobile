import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';
import { MentorInsight } from '@/types';

interface MentorInsightCardProps {
  insight: MentorInsight;
  compact?: boolean;
}

const TYPE_COLORS = {
  encouragement: { bg: '#6366F122', border: '#6366F144', text: '#818CF8' },
  warning: { bg: '#F59E0B22', border: '#F59E0B44', text: '#F59E0B' },
  tip: { bg: '#10B98122', border: '#10B98144', text: '#10B981' },
  achievement: { bg: '#8B5CF622', border: '#8B5CF644', text: '#A78BFA' },
};

export function MentorInsightCard({ insight, compact = false }: MentorInsightCardProps) {
  const { colors } = useThemeStore();
  const router = useRouter();
  const palette = TYPE_COLORS[insight.type];

  const handleAction = () => {
    if (insight.action_route) {
      router.push(insight.action_route as any);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
        compact && styles.compact,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{insight.icon}</Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{insight.title}</Text>
        </View>
      </View>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{insight.message}</Text>
      {insight.action_label && insight.action_route && (
        <TouchableOpacity style={[styles.actionBtn, { borderColor: palette.border }]} onPress={handleAction}>
          <Text style={[styles.actionText, { color: palette.text }]}>{insight.action_label} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  compact: { padding: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: { fontSize: 24, marginRight: 10 },
  titleContainer: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
});
