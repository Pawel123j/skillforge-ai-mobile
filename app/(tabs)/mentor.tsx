import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { generateAllInsights } from '@/services/mentorService';
import { MentorInsightCard } from '@/components/cards/MentorInsightCard';
import { LoadingState } from '@/components/common/LoadingState';
import { MentorInsight } from '@/types';
import { getXpLevel } from '@/utils';

export default function MentorScreen() {
  const { colors } = useThemeStore();
  const { profile, progress, userId } = useAuthStore();
  const { tasks, loadTasks } = useTaskStore();
  const { projects, loadProjects } = useProjectStore();

  const [insights, setInsights] = useState<MentorInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInsights = async () => {
    if (!profile || !progress) return;

    if (userId && tasks.length === 0) {
      await loadTasks(userId);
    }
    if (userId && projects.length === 0) {
      await loadProjects(userId, profile.learning_goal);
    }

    const generated = generateAllInsights(profile, progress, tasks, projects);
    setInsights(generated);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadInsights();
  }, [profile, progress]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInsights();
  };

  if (isLoading) return <LoadingState message="Analyzing your progress..." fullScreen />;

  const xpInfo = getXpLevel(progress?.xp ?? 0);
  const nextLevelXp = xpInfo.nextLevelXp - (progress?.xp ?? 0);

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
          <Text style={[styles.screenLabel, { color: colors.textSecondary }]}>AI Learning Assistant</Text>
          <Text style={[styles.title, { color: colors.text }]}>Your Mentor</Text>
        </View>

        {/* Mentor Avatar */}
        <View style={[styles.mentorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.mentorAvatar}>🤖</Text>
          <Text style={[styles.mentorName, { color: colors.text }]}>SkillForge AI Mentor</Text>
          <Text style={[styles.mentorDesc, { color: colors.textSecondary }]}>
            I analyze your learning activity and provide personalized insights to keep you on track.
          </Text>
          <View style={[styles.mentorBadge, { backgroundColor: `${colors.primary}18` }]}>
            <Text style={[styles.mentorBadgeText, { color: colors.primary }]}>
              Rule-Based Engine • OpenAI Ready
            </Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.xpHeader}>
            <View>
              <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>Current Level</Text>
              <Text style={[styles.xpLevel, { color: colors.text }]}>
                Level {xpInfo.level} · {xpInfo.title}
              </Text>
            </View>
            <View style={[styles.xpBadge, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[styles.xpValue, { color: colors.primary }]}>
                {progress?.xp ?? 0} XP
              </Text>
            </View>
          </View>
          <View style={[styles.xpProgressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.xpProgressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, ((progress?.xp ?? 0) / xpInfo.nextLevelXp) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.xpNext, { color: colors.textMuted }]}>
            {nextLevelXp > 0 ? `${nextLevelXp} XP to next level` : 'Max level reached!'}
          </Text>
        </View>

        {/* Activity Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Activity Overview</Text>
          <View style={styles.statsGrid}>
            {[
              { icon: '📚', label: 'Lessons', value: progress?.completed_lessons.length ?? 0 },
              { icon: '📦', label: 'Modules', value: progress?.completed_modules.length ?? 0 },
              { icon: '✅', label: 'Tasks Done', value: tasks.filter((t) => t.status === 'done').length },
              { icon: '🚀', label: 'Projects', value: projects.filter((p) => p.status === 'completed').length },
              { icon: '🔥', label: 'Streak', value: `${progress?.streak_days ?? 0}d` },
              { icon: '⭐', label: 'XP', value: progress?.xp ?? 0 },
            ].map((stat) => (
              <View
                key={stat.label}
                style={[styles.statsItem, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Text style={styles.statsItemIcon}>{stat.icon}</Text>
                <Text style={[styles.statsItemValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statsItemLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={[styles.insightsTitle, { color: colors.text }]}>
            Personalized Insights ({insights.length})
          </Text>
          {insights.map((insight) => (
            <View key={insight.id} style={styles.insightItem}>
              <MentorInsightCard insight={insight} />
            </View>
          ))}
        </View>

        {/* Future AI Note */}
        <View style={[styles.aiNote, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.aiNoteTitle, { color: colors.text }]}>🚀 Coming Soon: GPT-4 Mentor</Text>
          <Text style={[styles.aiNoteText, { color: colors.textSecondary }]}>
            The architecture is ready for OpenAI integration. Soon your mentor will generate
            dynamic, conversational insights tailored to your exact learning style.
          </Text>
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
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  mentorCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  mentorAvatar: { fontSize: 52, marginBottom: 12 },
  mentorName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  mentorDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  mentorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mentorBadgeText: { fontSize: 12, fontWeight: '600' },
  xpCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  xpLabel: { fontSize: 12, marginBottom: 2 },
  xpLevel: { fontSize: 17, fontWeight: '700' },
  xpBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  xpValue: { fontSize: 16, fontWeight: '700' },
  xpProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpNext: { fontSize: 12 },
  statsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  statsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statsItem: {
    width: '30%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flexGrow: 1,
  },
  statsItemIcon: { fontSize: 22, marginBottom: 4 },
  statsItemValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statsItemLabel: { fontSize: 11 },
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  insightsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, letterSpacing: -0.2 },
  insightItem: { marginBottom: 12 },
  aiNote: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  aiNoteTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  aiNoteText: { fontSize: 13, lineHeight: 19 },
  bottomPad: { height: 20 },
});
