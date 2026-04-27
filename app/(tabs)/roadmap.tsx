import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { roadmapService } from '@/services/roadmapService';
import { ModuleCard } from '@/components/cards/ModuleCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ModuleWithProgress } from '@/types';
import { GoalColors, GoalIcons, GoalLabels } from '@/constants';
import { calcProgressPercent } from '@/utils';

export default function RoadmapScreen() {
  const { colors } = useThemeStore();
  const { profile, progress } = useAuthStore();
  const router = useRouter();

  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goal = profile?.learning_goal;
  const goalColor = goal ? GoalColors[goal] : colors.primary;

  const loadModules = useCallback(async () => {
    if (!goal || !progress) return;

    setError(null);
    try {
      const data = await roadmapService.getModulesForGoal(
        goal,
        progress.completed_modules,
        progress.completed_lessons
      );
      setModules(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load roadmap');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [goal, progress]);

  useEffect(() => {
    loadModules();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadModules();
  };

  if (isLoading) return <LoadingState message="Loading roadmap..." fullScreen />;
  if (error) return <ErrorState message={error} onRetry={loadModules} />;

  const completedModules = modules.filter((m) => m.is_completed).length;
  const overallProgress = calcProgressPercent(completedModules, modules.length);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenLabel, { color: colors.textSecondary }]}>Learning Roadmap</Text>
            {goal && (
              <Text style={[styles.title, { color: colors.text }]}>
                {GoalIcons[goal]} {GoalLabels[goal]}
              </Text>
            )}
          </View>
        </View>

        {/* Progress Summary */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: colors.text }]}>
                {completedModules}
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: colors.text }]}>
                {modules.length - completedModules}
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                Remaining
              </Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: goalColor }]}>
                {overallProgress}%
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                Complete
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={overallProgress}
            color={goalColor}
            height={8}
            animated
          />
        </View>

        {/* Module List */}
        <View style={styles.moduleList}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            All Modules ({modules.length})
          </Text>
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              goalColor={goalColor}
              onPress={() => router.push(`/module/${module.id}` as any)}
            />
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  screenLabel: { fontSize: 13, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  progressCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStat: { alignItems: 'center' },
  progressStatValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  progressStatLabel: { fontSize: 12 },
  progressDivider: { width: 1, marginHorizontal: 16 },
  moduleList: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  bottomPad: { height: 20 },
});
