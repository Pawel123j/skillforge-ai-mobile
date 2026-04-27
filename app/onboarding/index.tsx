import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { progressService } from '@/services/progressService';
import { Button } from '@/components/common/Button';
import { LearningGoal, SkillLevel, DailyTime } from '@/types';
import { GoalColors, GoalLabels, GoalIcons, SkillLevelLabels, DailyTimeLabels } from '@/constants';

const GOALS: LearningGoal[] = ['frontend', 'backend', 'mobile', 'cybersecurity', 'data_analyst', 'python'];
const LEVELS: SkillLevel[] = ['beginner', 'intermediate'];
const DAILY_TIMES: DailyTime[] = [15, 30, 60, 90];

const STEPS = ['goal', 'level', 'time'] as const;
type Step = typeof STEPS[number];

export default function OnboardingScreen() {
  const { colors } = useThemeStore();
  const { userId, profile, updateProfile, updateProgress } = useAuthStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>('goal');
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [selectedTime, setSelectedTime] = useState<DailyTime | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const canProceed = () => {
    if (step === 'goal') return selectedGoal !== null;
    if (step === 'level') return selectedLevel !== null;
    if (step === 'time') return selectedTime !== null;
    return false;
  };

  const handleNext = () => {
    if (step === 'goal') setStep('level');
    else if (step === 'level') setStep('time');
    else handleFinish();
  };

  const handleBack = () => {
    if (step === 'level') setStep('goal');
    else if (step === 'time') setStep('level');
  };

  const handleFinish = async () => {
    if (!userId || !selectedGoal || !selectedLevel || !selectedTime) return;

    setIsLoading(true);
    try {
      await profileService.completeOnboarding(userId, {
        learning_goal: selectedGoal,
        skill_level: selectedLevel,
        daily_time_minutes: selectedTime,
      });

      updateProfile({
        learning_goal: selectedGoal,
        skill_level: selectedLevel,
        daily_time_minutes: selectedTime,
        onboarding_completed: true,
      });

      const progress = await progressService.getProgress(userId);
      updateProgress(progress);

      router.replace('/(tabs)/dashboard');
    } catch (err) {
      // Still navigate — profile update is non-blocking in mock mode
      router.replace('/(tabs)/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <View
          key={s}
          style={[
            styles.stepDot,
            {
              backgroundColor: i <= stepIndex ? colors.primary : colors.border,
              width: i === stepIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderGoalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        What do you want to become?
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Choose your learning goal. You can change this later.
      </Text>
      <View style={styles.goalGrid}>
        {GOALS.map((goal) => {
          const isSelected = selectedGoal === goal;
          const goalColor = GoalColors[goal];
          return (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalCard,
                {
                  backgroundColor: isSelected ? `${goalColor}18` : colors.surface,
                  borderColor: isSelected ? goalColor : colors.border,
                },
              ]}
              onPress={() => setSelectedGoal(goal)}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>{GoalIcons[goal]}</Text>
              <Text
                style={[
                  styles.goalLabel,
                  { color: isSelected ? goalColor : colors.text },
                ]}
                numberOfLines={2}
              >
                {GoalLabels[goal]}
              </Text>
              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: goalColor }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderLevelStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>📊</Text>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        What's your current level?
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        This helps us tailor the roadmap to your experience.
      </Text>
      <View style={styles.levelOptions}>
        {LEVELS.map((level) => {
          const isSelected = selectedLevel === level;
          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.levelCard,
                {
                  backgroundColor: isSelected ? `${colors.primary}18` : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedLevel(level)}
              activeOpacity={0.8}
            >
              <Text style={styles.levelEmoji}>
                {level === 'beginner' ? '🌱' : '🚀'}
              </Text>
              <View style={styles.levelText}>
                <Text style={[styles.levelName, { color: isSelected ? colors.primary : colors.text }]}>
                  {SkillLevelLabels[level]}
                </Text>
                <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>
                  {level === 'beginner'
                    ? 'Little or no prior coding experience'
                    : 'Some experience with programming concepts'}
                </Text>
              </View>
              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTimeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>⏱️</Text>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Daily learning commitment
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Consistent daily practice is the key to mastery.
      </Text>
      <View style={styles.timeOptions}>
        {DAILY_TIMES.map((time) => {
          const isSelected = selectedTime === time;
          return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeCard,
                {
                  backgroundColor: isSelected ? `${colors.primary}18` : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedTime(time)}
              activeOpacity={0.8}
            >
              <Text style={[styles.timeValue, { color: isSelected ? colors.primary : colors.text }]}>
                {DailyTimeLabels[time]}
              </Text>
              <Text style={[styles.timeDesc, { color: colors.textSecondary }]}>
                {time === 15 && 'Great for busy schedules'}
                {time === 30 && 'Steady and consistent'}
                {time === 60 && 'Serious commitment'}
                {time === 90 && 'Fast track to success'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        {stepIndex > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        {renderStepIndicator()}
        <Text style={[styles.stepCount, { color: colors.textMuted }]}>
          {stepIndex + 1}/{STEPS.length}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'goal' && renderGoalStep()}
        {step === 'level' && renderLevelStep()}
        {step === 'time' && renderTimeStep()}
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          title={step === 'time' ? 'Start Learning 🚀' : 'Continue'}
          onPress={handleNext}
          disabled={!canProceed()}
          loading={isLoading}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16 },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  stepCount: { width: 60, textAlign: 'right', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  stepContent: { alignItems: 'center' },
  stepEmoji: { fontSize: 52, marginBottom: 16 },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  goalCard: {
    width: '46%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  goalIcon: { fontSize: 32, marginBottom: 8 },
  goalLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  levelOptions: { width: '100%', gap: 12 },
  levelCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  levelEmoji: { fontSize: 32, marginRight: 14 },
  levelText: { flex: 1 },
  levelName: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  levelDesc: { fontSize: 13, lineHeight: 18 },
  timeOptions: { width: '100%', gap: 12 },
  timeCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 18,
    position: 'relative',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeDesc: { fontSize: 13 },
  bottomBar: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
  },
});
