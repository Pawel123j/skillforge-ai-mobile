import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { ModuleWithProgress } from '@/types';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Badge } from '@/components/common/Badge';
import { getDifficultyColor, getDifficultyLabel, calcProgressPercent, formatHours } from '@/utils';

interface ModuleCardProps {
  module: ModuleWithProgress;
  onPress: () => void;
  goalColor?: string;
}

export function ModuleCard({ module, onPress, goalColor = '#6366F1' }: ModuleCardProps) {
  const { colors } = useThemeStore();
  const progress = calcProgressPercent(module.completed_lessons, module.total_lessons);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        module.is_locked && styles.locked,
      ]}
      onPress={onPress}
      disabled={module.is_locked}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: module.is_locked ? colors.border : `${goalColor}22` }]}>
          <Text style={styles.icon}>{module.is_locked ? '🔒' : module.icon}</Text>
        </View>
        <View style={styles.meta}>
          <View style={styles.badges}>
            <Badge
              label={getDifficultyLabel(module.difficulty)}
              backgroundColor={`${getDifficultyColor(module.difficulty)}22`}
              color={getDifficultyColor(module.difficulty)}
              size="sm"
            />
            {module.is_completed && (
              <Badge label="Completed" backgroundColor="#10B98122" color="#10B981" size="sm" style={styles.badgeGap} />
            )}
          </View>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatHours(module.estimated_hours)} estimated
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: module.is_locked ? colors.textMuted : colors.text }]}>
        {module.title}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
        {module.description}
      </Text>

      <View style={styles.progressSection}>
        <ProgressBar
          progress={progress}
          color={module.is_locked ? colors.border : goalColor}
          height={6}
          animated={!module.is_locked}
        />
        <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
          {module.completed_lessons}/{module.total_lessons} lessons
        </Text>
      </View>

      {!module.is_locked && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.primary }]}>
            {module.is_completed ? 'Review Module →' : progress > 0 ? 'Continue →' : 'Start Module →'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  locked: { opacity: 0.55 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 24 },
  meta: { flex: 1 },
  badges: { flexDirection: 'row', marginBottom: 4 },
  badgeGap: { marginLeft: 6 },
  time: { fontSize: 12 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  progressSection: { marginBottom: 4 },
  progressLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
