import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { roadmapService } from '@/services/roadmapService';
import { MOCK_MODULES } from '@/lib/mockData';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { LoadingState } from '@/components/common/LoadingState';
import { LessonWithProgress, Module } from '@/types';
import { getDifficultyColor, getDifficultyLabel, calcProgressPercent, formatMinutes } from '@/utils';
import { GoalColors } from '@/constants';

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const { progress, profile } = useAuthStore();
  const router = useRouter();

  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const goalColor = profile?.learning_goal ? GoalColors[profile.learning_goal] : colors.primary;

  useEffect(() => {
    if (!id) return;
    loadModuleData();
  }, [id]);

  const loadModuleData = async () => {
    if (!id || !progress) return;
    try {
      const lessonData = await roadmapService.getLessonsForModule(id, progress.completed_lessons);
      setLessons(lessonData);

      const allModules = Object.values(MOCK_MODULES).flat();
      const found = allModules.find((m) => m.id === id);
      setModule(found ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading module..." fullScreen />;

  const completedCount = lessons.filter((l) => l.is_completed).length;
  const progress_pct = calcProgressPercent(completedCount, lessons.length);
  const allCompleted = lessons.length > 0 && completedCount === lessons.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Module Detail
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Module Info */}
        <View style={styles.moduleInfo}>
          <Text style={styles.moduleIcon}>{module?.icon ?? '📚'}</Text>
          <Text style={[styles.moduleTitle, { color: colors.text }]}>
            {module?.title ?? 'Module'}
          </Text>
          <Text style={[styles.moduleDesc, { color: colors.textSecondary }]}>
            {module?.description}
          </Text>
          <View style={styles.moduleBadges}>
            {module && (
              <Badge
                label={getDifficultyLabel(module.difficulty)}
                backgroundColor={`${getDifficultyColor(module.difficulty)}22`}
                color={getDifficultyColor(module.difficulty)}
                size="sm"
              />
            )}
            {module && (
              <Badge
                label={`${module.estimated_hours}h`}
                backgroundColor={colors.surfaceSecondary}
                color={colors.textSecondary}
                size="sm"
              />
            )}
            {allCompleted && (
              <Badge label="✓ Completed" backgroundColor="#10B98122" color="#10B981" size="sm" />
            )}
          </View>

          <View style={styles.progressSection}>
            <ProgressBar
              progress={progress_pct}
              color={goalColor}
              height={8}
              showLabel
              label="Progress"
              animated
            />
          </View>
        </View>

        {/* Lessons */}
        <View style={styles.lessonsSection}>
          <View style={styles.lessonsSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Lessons ({lessons.length})
            </Text>
            <Text style={[styles.lessonCount, { color: colors.textSecondary }]}>
              {completedCount}/{lessons.length} done
            </Text>
          </View>

          {lessons.map((lesson, index) => {
            const isUnlocked = index === 0 || lessons[index - 1].is_completed;
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  { backgroundColor: colors.card, borderColor: lesson.is_completed ? '#10B98133' : colors.border },
                  !isUnlocked && styles.lessonLocked,
                ]}
                onPress={() => isUnlocked && router.push(`/lesson/${lesson.id}` as any)}
                disabled={!isUnlocked}
                activeOpacity={isUnlocked ? 0.85 : 1}
              >
                <View style={styles.lessonRow}>
                  <View
                    style={[
                      styles.lessonNumber,
                      {
                        backgroundColor: lesson.is_completed
                          ? '#10B981'
                          : isUnlocked
                          ? `${goalColor}22`
                          : colors.surfaceSecondary,
                      },
                    ]}
                  >
                    {lesson.is_completed ? (
                      <Text style={styles.lessonCheck}>✓</Text>
                    ) : !isUnlocked ? (
                      <Text style={[styles.lessonNumberText, { color: colors.textMuted }]}>🔒</Text>
                    ) : (
                      <Text style={[styles.lessonNumberText, { color: goalColor }]}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.lessonContent}>
                    <Text
                      style={[
                        styles.lessonTitle,
                        { color: isUnlocked ? colors.text : colors.textMuted },
                        lesson.is_completed && styles.lessonTitleDone,
                      ]}
                      numberOfLines={2}
                    >
                      {lesson.title}
                    </Text>
                    <View style={styles.lessonMeta}>
                      <Text style={[styles.lessonTime, { color: colors.textMuted }]}>
                        ⏱ {formatMinutes(lesson.estimated_minutes)}
                      </Text>
                      <Badge
                        label={lesson.type}
                        backgroundColor={colors.surfaceSecondary}
                        color={colors.textSecondary}
                        size="sm"
                      />
                    </View>
                  </View>
                  {isUnlocked && !lesson.is_completed && (
                    <Text style={[styles.lessonArrow, { color: goalColor }]}>→</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Take Quiz */}
        {allCompleted && (
          <View style={styles.quizSection}>
            <View style={[styles.quizCard, { backgroundColor: `${goalColor}18`, borderColor: `${goalColor}33` }]}>
              <Text style={styles.quizIcon}>📝</Text>
              <Text style={[styles.quizTitle, { color: colors.text }]}>Module Quiz</Text>
              <Text style={[styles.quizDesc, { color: colors.textSecondary }]}>
                You've completed all lessons! Take the quiz to earn XP and unlock the next module.
              </Text>
              <Button
                title="Take Quiz →"
                onPress={() => router.push(`/quiz/${id}` as any)}
                style={{ backgroundColor: goalColor }}
                fullWidth
              />
            </View>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { width: 60 },
  moduleInfo: {
    padding: 24,
    alignItems: 'center',
  },
  moduleIcon: { fontSize: 52, marginBottom: 12 },
  moduleTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 },
  moduleDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 14 },
  moduleBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  progressSection: { width: '100%' },
  lessonsSection: { paddingHorizontal: 20, marginTop: 8 },
  lessonsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  lessonCount: { fontSize: 14 },
  lessonCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  lessonLocked: { opacity: 0.5 },
  lessonRow: { flexDirection: 'row', alignItems: 'center' },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  lessonCheck: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  lessonNumberText: { fontSize: 14, fontWeight: '700' },
  lessonContent: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6, lineHeight: 21 },
  lessonTitleDone: { textDecorationLine: 'line-through' },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lessonTime: { fontSize: 12 },
  lessonArrow: { fontSize: 18, marginLeft: 8 },
  quizSection: { padding: 20 },
  quizCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  quizIcon: { fontSize: 40, marginBottom: 10 },
  quizTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  quizDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  bottomPad: { height: 30 },
});
