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
import { useToastStore } from '@/stores/toastStore';
import { roadmapService } from '@/services/roadmapService';
import { progressService } from '@/services/progressService';
import { XP_VALUES } from '@/constants';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { LoadingState } from '@/components/common/LoadingState';
import { Lesson } from '@/types';
import { formatMinutes } from '@/utils';
import { GoalColors } from '@/constants';

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const { progress, profile, updateProgress, userId } = useAuthStore();
  const { showXP, showAchievement, showStreak } = useToastStore();
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const goalColor = profile?.learning_goal ? GoalColors[profile.learning_goal] : colors.primary;

  useEffect(() => {
    if (!id) return;
    loadLesson();
  }, [id]);

  const loadLesson = async () => {
    try {
      const data = await roadmapService.getLessonById(id!);
      setLesson(data);
      setIsCompleted(progress?.completed_lessons.includes(id!) ?? false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!userId || !progress || !lesson || isCompleted) return;

    setIsCompleting(true);
    try {
      const updated = await progressService.completeLesson(userId, lesson.id, progress);
      updateProgress(updated);
      setIsCompleted(true);

      // Fire XP toast
      showXP(XP_VALUES.LESSON_COMPLETE);

      // Streak toast on new day
      if (updated.streak_days > (progress.streak_days)) {
        setTimeout(() => showStreak(updated.streak_days), 600);
      }

      // Achievement toasts at milestones
      const total = updated.completed_lessons.length;
      if (total === 1) setTimeout(() => showAchievement('First Lesson Done!', 'Your journey has begun'), 1200);
      else if (total === 5) setTimeout(() => showAchievement('5 Lessons Completed!', 'You\'re building momentum'), 1200);
      else if (total === 10) setTimeout(() => showAchievement('10 Lessons!', 'You\'re on a roll 🚀'), 1200);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading || !lesson) return <LoadingState message="Loading lesson..." fullScreen />;

  const TYPE_ICONS: Record<string, string> = {
    reading: '📖',
    video: '🎥',
    exercise: '💻',
    project: '🚀',
  };

  // Render markdown-like content with basic formatting
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) {
        return (
          <Text key={i} style={[styles.contentH1, { color: colors.text }]}>
            {line.replace('# ', '')}
          </Text>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <Text key={i} style={[styles.contentH2, { color: colors.text }]}>
            {line.replace('## ', '')}
          </Text>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <Text key={i} style={[styles.contentH3, { color: colors.text }]}>
            {line.replace('### ', '')}
          </Text>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <Text key={i} style={[styles.contentBullet, { color: colors.textSecondary }]}>
            {'  •  '}{line.replace('- ', '')}
          </Text>
        );
      }
      if (line.startsWith('```')) {
        return (
          <View key={i} style={[styles.codeBlock, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.codeText, { color: '#34D399' }]}>{line.replace(/```\w*/, '').trim()}</Text>
          </View>
        );
      }
      if (line.trim() === '') {
        return <View key={i} style={styles.spacer} />;
      }
      return (
        <Text key={i} style={[styles.contentP, { color: colors.textSecondary }]}>
          {line}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        {isCompleted && (
          <View style={[styles.completedBadge, { backgroundColor: '#10B98122' }]}>
            <Text style={[styles.completedText, { color: '#10B981' }]}>✓ Completed</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Lesson Header */}
        <View style={styles.lessonHeader}>
          <View style={styles.lessonMeta}>
            <Badge
              label={`${TYPE_ICONS[lesson.type]} ${lesson.type}`}
              backgroundColor={`${goalColor}22`}
              color={goalColor}
              size="sm"
            />
            <Text style={[styles.lessonTime, { color: colors.textMuted }]}>
              ⏱ {formatMinutes(lesson.estimated_minutes)}
            </Text>
          </View>
          <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Content */}
        <View style={styles.contentContainer}>
          {renderContent(lesson.content)}
        </View>

        {/* Complete Button */}
        <View style={styles.completeSection}>
          {isCompleted ? (
            <View style={[styles.completedCard, { backgroundColor: '#10B98118', borderColor: '#10B98133' }]}>
              <Text style={styles.completedEmoji}>🎉</Text>
              <Text style={[styles.completedCardTitle, { color: '#10B981' }]}>
                Lesson Completed!
              </Text>
              <Text style={[styles.completedCardDesc, { color: colors.textSecondary }]}>
                You earned 50 XP for completing this lesson.
              </Text>
              <Button
                title="← Back to Module"
                onPress={() => router.back()}
                variant="outline"
                style={{ borderColor: '#10B981' }}
              />
            </View>
          ) : (
            <Button
              title="Mark as Completed ✓"
              onPress={handleComplete}
              loading={isCompleting}
              fullWidth
              size="lg"
              style={{ backgroundColor: goalColor }}
            />
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, fontWeight: '600' },
  completedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  completedText: { fontSize: 13, fontWeight: '600' },
  lessonHeader: { padding: 20 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  lessonTime: { fontSize: 13 },
  lessonTitle: { fontSize: 22, fontWeight: '800', lineHeight: 30, letterSpacing: -0.3 },
  divider: { height: 1, marginHorizontal: 20 },
  contentContainer: { padding: 20 },
  contentH1: { fontSize: 22, fontWeight: '800', marginBottom: 12, marginTop: 8, letterSpacing: -0.3 },
  contentH2: { fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 16 },
  contentH3: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  contentP: { fontSize: 15, lineHeight: 24, marginBottom: 8 },
  contentBullet: { fontSize: 15, lineHeight: 24, marginBottom: 4 },
  codeBlock: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  codeText: { fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  spacer: { height: 8 },
  completeSection: { padding: 20 },
  completedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  completedEmoji: { fontSize: 36, marginBottom: 10 },
  completedCardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  completedCardDesc: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  bottomPad: { height: 30 },
});
