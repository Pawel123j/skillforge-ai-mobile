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
import { XPRingCard } from '@/components/cards/XPRingCard';
import { WeeklyActivityChart } from '@/components/cards/WeeklyActivityChart';
import { ProgressBar } from '@/components/common/ProgressBar';
import { LoadingState } from '@/components/common/LoadingState';
import { ModuleWithProgress, MentorInsight } from '@/types';
import { GoalColors, GoalIcons, GoalLabels } from '@/constants';
import { calcProgressPercent } from '@/utils';

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
  const goalColor = goal ? GoalColors[goal] : colors.primary;

  const loadData = useCallback(async () => {
    if (!userId || !goal || !progress || !profile) return;
    try {
      const [modules] = await Promise.all([
        roadmapService.getModulesForGoal(goal, progress.completed_modules, progress.completed_lessons),
        loadTasks(userId),
        loadProjects(userId, goal),
      ]);
      const activeModule = modules.find((m) => !m.is_completed && !m.is_locked) ?? modules[0] ?? null;
      setCurrentModule(activeModule);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, goal, progress, profile]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (profile && progress && tasks.length >= 0 && projects.length >= 0) {
      setMentorInsight(generateMentorInsight(profile, progress, tasks, projects));
    }
  }, [profile, progress, tasks, projects]);

  const onRefresh = async () => { setIsRefreshing(true); await loadData(); };

  if (isLoading) return <LoadingState message="Loading dashboard..." fullScreen />;

  const completedLessons = progress?.completed_lessons.length ?? 0;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const overallProgress = calcProgressPercent(progress?.completed_modules.length ?? 0, 8);
  const todayTask = tasks.find((t) => t.status !== 'done') ?? null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Developer'} 👋
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
          </View>
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: `${goalColor}22`, borderColor: `${goalColor}44` }]}
            onPress={() => router.push('/(tabs)/mentor')}
          >
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakCount, { color: goalColor }]}>{progress?.streak_days ?? 0}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Goal banner ── */}
        {goal && (
          <TouchableOpacity
            style={[styles.goalCard, { backgroundColor: `${goalColor}18`, borderColor: `${goalColor}33` }]}
            onPress={() => router.push('/(tabs)/roadmap')}
            activeOpacity={0.85}
          >
            <Text style={styles.goalIcon}>{GoalIcons[goal]}</Text>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Your Path</Text>
              <Text style={[styles.goalTitle, { color: colors.text }]}>{GoalLabels[goal]}</Text>
            </View>
            <View style={styles.goalRight}>
              <Text style={[styles.goalProgress, { color: goalColor }]}>{overallProgress}%</Text>
              <Text style={[styles.goalProgressLabel, { color: colors.textMuted }]}>complete</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── XP Ring ── */}
        <View style={styles.px}>
          <XPRingCard xp={progress?.xp ?? 0} goalColor={goalColor} />
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatCard icon="📚" value={completedLessons} label="Lessons" color="#10B981" />
          <StatCard icon="🚀" value={completedProjects} label="Projects" color="#8B5CF6" />
          <StatCard icon="✅" value={tasks.filter((t) => t.status === 'done').length} label="Tasks" color="#F59E0B" />
        </View>

        {/* ── Current Module ── */}
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
                    {currentModule.completed_lessons}/{currentModule.total_lessons} lessons
                  </Text>
                </View>
                <Text style={[styles.continueArrow, { color: goalColor }]}>→</Text>
              </View>
              <ProgressBar
                progress={calcProgressPercent(currentModule.completed_lessons, currentModule.total_lessons)}
                color={goalColor}
                height={6}
                animated
              />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Today's Task ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Focus</Text>
          {todayTask ? (
            <TouchableOpacity
              style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/tasks')}
              activeOpacity={0.85}
            >
              <View style={[styles.taskStatusDot, { backgroundColor: '#F59E0B' }]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
                  {todayTask.title}
                </Text>
                {todayTask.module_title && (
                  <Text style={[styles.taskMeta, { color: colors.textMuted }]}>
                    📚 {todayTask.module_title}
                  </Text>
                )}
              </View>
              <Text style={[styles.taskArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.noTaskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/tasks')}
              activeOpacity={0.85}
            >
              <Text style={styles.noTaskIcon}>🎉</Text>
              <Text style={[styles.noTaskText, { color: colors.textSecondary }]}>
                All caught up! Add a new task →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Weekly Activity ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Activity</Text>
          <WeeklyActivityChart
            completedLessons={progress?.completed_lessons ?? []}
            xp={progress?.xp ?? 0}
            lastActivityDate={progress?.last_activity_date ?? null}
            streakDays={progress?.streak_days ?? 0}
          />
        </View>

        {/* ── Mentor Insight ── */}
        {mentorInsight && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🧠 Mentor Insight</Text>
            <MentorInsightCard insight={mentorInsight} />
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { icon: '🗺️', label: 'Roadmap', route: '/(tabs)/roadmap' },
              { icon: '✅', label: 'Tasks', route: '/(tabs)/tasks' },
              { icon: '🚀', label: 'Projects', route: '/(tabs)/projects' },
              { icon: '🧠', label: 'Mentor', route: '/(tabs)/mentor' },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>{a.icon}</Text>
                <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
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
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, marginBottom: 3 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
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
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalIcon: { fontSize: 28, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: 11, marginBottom: 2 },
  goalTitle: { fontSize: 16, fontWeight: '700' },
  goalRight: { alignItems: 'flex-end' },
  goalProgress: { fontSize: 20, fontWeight: '800' },
  goalProgressLabel: { fontSize: 11 },
  px: { paddingHorizontal: 20, marginBottom: 14 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },
  moduleCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  moduleIcon: { fontSize: 26, marginRight: 10 },
  moduleInfo: { flex: 1 },
  moduleTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  moduleProgress: { fontSize: 12 },
  continueArrow: { fontSize: 20, marginLeft: 8 },
  taskCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStatusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, flexShrink: 0 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  taskMeta: { fontSize: 12, marginTop: 3 },
  taskArrow: { fontSize: 18, marginLeft: 8 },
  noTaskCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noTaskIcon: { fontSize: 22 },
  noTaskText: { fontSize: 14 },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  quickActionIcon: { fontSize: 22, marginBottom: 4 },
  quickActionLabel: { fontSize: 11, fontWeight: '600' },
});
