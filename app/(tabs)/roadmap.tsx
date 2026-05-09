import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { roadmapService } from '@/services/roadmapService';
import { ProgressBar } from '@/components/common/ProgressBar';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Badge } from '@/components/common/Badge';
import { ModuleWithProgress } from '@/types';
import { GoalColors, GoalIcons, GoalLabels } from '@/constants';
import { calcProgressPercent, getDifficultyColor, getDifficultyLabel, formatHours } from '@/utils';

type FilterType = 'all' | 'active' | 'completed' | 'locked';

export default function RoadmapScreen() {
  const { colors } = useThemeStore();
  const { profile, progress } = useAuthStore();
  const router = useRouter();

  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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

  useEffect(() => { loadModules(); }, []);

  const onRefresh = async () => { setIsRefreshing(true); await loadModules(); };

  const filteredModules = useMemo(() => {
    let result = modules;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    switch (activeFilter) {
      case 'active':
        result = result.filter((m) => !m.is_completed && !m.is_locked);
        break;
      case 'completed':
        result = result.filter((m) => m.is_completed);
        break;
      case 'locked':
        result = result.filter((m) => m.is_locked);
        break;
    }

    return result;
  }, [modules, searchQuery, activeFilter]);

  if (isLoading) return <LoadingState message="Loading roadmap..." fullScreen />;
  if (error) return <ErrorState message={error} onRetry={loadModules} />;

  const completedModules = modules.filter((m) => m.is_completed).length;
  const overallProgress = calcProgressPercent(completedModules, modules.length);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
    { key: 'locked', label: 'Locked' },
  ];

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
          <Text style={[styles.screenLabel, { color: colors.textSecondary }]}>Learning Roadmap</Text>
          {goal && (
            <Text style={[styles.title, { color: colors.text }]}>
              {GoalIcons[goal]} {GoalLabels[goal]}
            </Text>
          )}
        </View>

        {/* Progress Summary */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: '#10B981' }]}>{completedModules}</Text>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>Done</Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: goalColor }]}>
                {modules.filter((m) => !m.is_completed && !m.is_locked).length}
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>Active</Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: colors.textMuted }]}>
                {modules.filter((m) => m.is_locked).length}
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>Locked</Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: goalColor }]}>{overallProgress}%</Text>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>Done</Text>
            </View>
          </View>
          <ProgressBar progress={overallProgress} color={goalColor} height={8} animated />
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search modules..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearSearch, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? goalColor : colors.card,
                    borderColor: isActive ? goalColor : colors.border,
                  },
                ]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Timeline */}
        <View style={styles.timeline}>
          {filteredModules.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No modules match your search
              </Text>
            </View>
          ) : (
            filteredModules.map((module, index) => (
              <TimelineModule
                key={module.id}
                module={module}
                goalColor={goalColor}
                isLast={index === filteredModules.length - 1}
                onPress={() => router.push(`/module/${module.id}` as any)}
                colors={colors}
              />
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface TimelineModuleProps {
  module: ModuleWithProgress;
  goalColor: string;
  isLast: boolean;
  onPress: () => void;
  colors: any;
}

function TimelineModule({ module, goalColor, isLast, onPress, colors }: TimelineModuleProps) {
  const progress = calcProgressPercent(module.completed_lessons, module.total_lessons);
  const dotColor = module.is_completed ? '#10B981' : module.is_locked ? colors.border : goalColor;

  return (
    <View style={styles.timelineItem}>
      {/* Left: dot + line */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor, borderColor: dotColor }]}>
          {module.is_completed ? (
            <Text style={styles.timelineDotText}>✓</Text>
          ) : module.is_locked ? (
            <Text style={styles.timelineDotText}>🔒</Text>
          ) : (
            <Text style={styles.timelineDotText}>{module.icon}</Text>
          )}
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
      </View>

      {/* Right: card */}
      <TouchableOpacity
        style={[
          styles.timelineCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          module.is_locked && { opacity: 0.5 },
          module.is_completed && { borderColor: '#10B98144' },
          !module.is_locked && !module.is_completed && progress > 0 && { borderColor: `${goalColor}66` },
        ]}
        onPress={onPress}
        disabled={module.is_locked}
        activeOpacity={0.85}
      >
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardBadges}>
            <Badge
              label={getDifficultyLabel(module.difficulty)}
              backgroundColor={`${getDifficultyColor(module.difficulty)}22`}
              color={getDifficultyColor(module.difficulty)}
              size="sm"
            />
            {module.is_completed && (
              <Badge label="✓ Done" backgroundColor="#10B98122" color="#10B981" size="sm" style={{ marginLeft: 6 }} />
            )}
            {!module.is_locked && !module.is_completed && progress > 0 && (
              <Badge label="In Progress" backgroundColor={`${goalColor}22`} color={goalColor} size="sm" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text style={[styles.cardTime, { color: colors.textMuted }]}>
            {formatHours(module.estimated_hours)}
          </Text>
        </View>

        <Text style={[styles.cardTitle, { color: module.is_locked ? colors.textMuted : colors.text }]}>
          {module.title}
        </Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {module.description}
        </Text>

        {!module.is_locked && (
          <>
            <ProgressBar
              progress={progress}
              color={module.is_completed ? '#10B981' : goalColor}
              height={5}
              animated={!module.is_locked}
            />
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLessons, { color: colors.textMuted }]}>
                {module.completed_lessons}/{module.total_lessons} lessons
              </Text>
              <Text style={[styles.cardAction, { color: module.is_completed ? '#10B981' : goalColor }]}>
                {module.is_completed ? 'Review →' : progress > 0 ? 'Continue →' : 'Start →'}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  screenLabel: { fontSize: 13, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  progressCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  progressStat: { alignItems: 'center' },
  progressStatValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  progressStatLabel: { fontSize: 11 },
  progressDivider: { width: 1, marginHorizontal: 8 },
  searchContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15 },
  clearSearch: { fontSize: 16, padding: 2 },
  filterRow: { marginBottom: 20 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  timeline: { paddingHorizontal: 20 },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 48,
    marginRight: 12,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotText: { fontSize: 16 },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 20,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cardTime: { fontSize: 11 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, letterSpacing: -0.2 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardLessons: { fontSize: 12 },
  cardAction: { fontSize: 13, fontWeight: '700' },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
