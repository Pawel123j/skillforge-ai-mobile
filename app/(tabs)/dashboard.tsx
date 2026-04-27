import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { roadmapService } from '@/services/roadmapService';
import { generateMentorInsight } from '@/services/mentorService';
import { StatCard } from '@/components/cards/StatCard';
import { MentorInsightCard } from '@/components/cards/MentorInsightCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { LoadingState } from '@/components/common/LoadingState';
import { ModuleWithProgress, MentorInsight } from '@/types';
import { GoalColors, GoalIcons, GoalLabels } from '@/constants';
import { calcProgressPercent, getXpLevel } from '@/utils';

export default function DashboardScreen() {
  const { colors } = useThemeStore();
  const { profile, progress } = useAuthStore();
  const { tasks, loadTasks } = useTaskStore();
  const { projects, loadProjects } = useProjectStore();
  const router = useRouter();

  const [currentModule, setCurrentModule] = useState<ModuleWithProgress | null>(null);
  const [mentorInsight, setMentorInsight] = useState<MentorInsight | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userId = useAuthStore((s) => s.userId);
  const goal = profile?.learning_goal;

  const loadData = useCallback(async () => {
    if (!userId || !goal || !progress || !profile) return;

    try {
      const [modules] = await Promise.all([
        roadmapService.getModulesForGoal(goal, progress.completed_modules, progress.completed_lessons),
        loadTasks(userId),
        loadProjects(userId, goal),
      ]);

      // Find first incomplete module
      const activeModule = modules.find((m) => !m.is_completed && !m.is_locked) ?? modules[0] ?? null;
      setCurrentModule(activeModule);

      const insight = generateMentorInsight(profile, progress, tasks, projects);
      setMentorInsight(insight);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, goal, progress, profile]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (profile && progress && tasks && projects) {
      const insight = generateMentorInsight(profile, progress, tasks, projects);
      setMentorInsight(insight);
    }
  }, [profile, progress, tasks, projects]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  if (isLoading) return <LoadingState message="Loading dashboard..." fullScreen />;

  const xpInfo = getXpLevel(progress?.xp ?? 0);
  const goalColor = goal ? GoalColors[goal] : colors.primary;
  const completedLessons = progress?.completed_lessons.length ?? 0;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const totalModuleCount = currentModule ? 8 : 0;
  const overallProgress = calcProgressPercent(
    progress?.completed_modules.length ?? 0,
    totalModuleCount || 8
  );
  const todayTask = tasks.find((t) => t.status !== 'done') ?? null;

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
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Good day, {profile?.full_name?.split(' ')[0] ?? 'Developer'} 👋
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>Your Dashboard</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: `${goalColor}22`, borderColor: `${goalColor}44` }]}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakCount, { color: goalColor }]}>{progress?.streak_days ?? 0}</Text>
          </View>
        </View>

        {/* Goal Card */}
        {goal && (
          <View style={[styles.goalCard, { backgroundColor: `${goalColor}18`, borderColor: `${goalColor}33` }]}>
            <View style={styles.goalCardHeader}>
              <Text style={styles.goalIcon}>{GoalIcons[goal]}</Text>
              <View style={styles.goalInfo}>
                <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Current Goal</Text>
                <Text style={[styles.goalTitle, { color: colors.text }]}>{GoalLabels[goal]}</Text>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: `${goalColor}22` }]}>
                <Text style={[styles.xpText, { color: goalColor }]}>Lv.{xpInfo.level}</Text>
                <Text style={[styles.xpTitle, { color: goalColor }]}>{xpInfo.title}</Text>
              </View>
            </View>
            <ProgressBar
              progress={overallProgress}
              color={goalColor}
              height={8}
              showLabel
              label="Overall Progress"
              animated
            />
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="⭐" value={progress?.xp ?? 0} label="XP Earned" color={goalColor} />
          <StatCard icon="📚" value={completedLessons} label="Lessons" color="#10B981" />
          <StatCard icon="🚀" value={completedProjects} label="Projects" color="#8B5CF6" />
        </View>

        {/* Current Module */}
        {currentModule && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Module</Text>
            <TouchableOpacity
              style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/module/${currentModule.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleIcon}>{currentModule.icon}</Text>
                <View style={styles.moduleInfo}>
                  <Text style={[styles.moduleTitle, { color: colors.text }]}>{currentModule.title}</Text>
                  <Text style={[styles.moduleProgress, { color: colors.textSecondary }]}>
                    {currentModule.completed_lessons}/{currentModule.total_lessons} lessons completed
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={calcProgressPercent(currentModule.completed_lessons, currentModule.total_lessons)}
                color={goalColor}
                height={6}
                animated
              />
              <Text style={[styles.continueText, { color: goalColor }]}>
                Continue Learning →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Task */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Focus</Text>
          {todayTask ? (
            <TouchableOpacity
              style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/tasks')}
              activeOpacity={0.85}
            >
              <View style={styles.taskHeader}>
                <View style={[styles.taskDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
                  {todayTask.title}
                </Text>
              </View>
              {todayTask.module_title && (
                <Text style={[styles.taskModule, { color: colors.textMuted }]}>
                  📚 {todayTask.module_title}
                </Text>
              )}
              <Text style={[styles.taskAction, { color: colors.primary }]}>View all tasks →</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.noTaskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.noTaskIcon}>🎉</Text>
              <Text style={[styles.noTaskText, { color: colors.textSecondary }]}>
                No pending tasks. Great work!
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                <Text style={[styles.taskAction, { color: colors.primary }]}>Add a new task →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Mentor Insight */}
        {mentorInsight && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🧠 Mentor Insight</Text>
            <MentorInsightCard insight={mentorInsight} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { icon: '🗺️', label: 'Roadmap', route: '/(tabs)/roadmap' },
              { icon: '✅', label: 'Tasks', route: '/(tabs)/tasks' },
              { icon: '🚀', label: 'Projects', route: '/(tabs)/projects' },
              { icon: '🧠', label: 'Mentor', route: '/(tabs)/mentor' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  streakFire: { fontSize: 18 },
  streakCount: { fontSize: 18, fontWeight: '800' },
  goalCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIcon: { fontSize: 32, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: 12, marginBottom: 2 },
  goalTitle: { fontSize: 17, fontWeight: '700' },
  xpBadge: {
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  xpText: { fontSize: 16, fontWeight: '800' },
  xpTitle: { fontSize: 10, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  moduleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  moduleIcon: { fontSize: 28, marginRight: 12 },
  moduleInfo: { flex: 1 },
  moduleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  moduleProgress: { fontSize: 13 },
  continueText: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  taskCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 10,
    flexShrink: 0,
  },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  taskModule: { fontSize: 12, marginBottom: 10 },
  taskAction: { fontSize: 14, fontWeight: '600' },
  noTaskCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  noTaskIcon: { fontSize: 32, marginBottom: 8 },
  noTaskText: { fontSize: 14, marginBottom: 10 },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  quickActionIcon: { fontSize: 22, marginBottom: 4 },
  quickActionLabel: { fontSize: 12, fontWeight: '600' },
  bottomPad: { height: 20 },
});
