import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { quizService } from '@/services/quizService';
import { progressService } from '@/services/progressService';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { LoadingState } from '@/components/common/LoadingState';
import { QuizQuestion } from '@/types';
import { QUIZ_PASS_THRESHOLD } from '@/constants';
import { GoalColors } from '@/constants';

type QuizState = 'question' | 'result';

export default function QuizScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { colors } = useThemeStore();
  const { userId, progress, profile, updateProgress } = useAuthStore();
  const router = useRouter();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<QuizState>('question');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const goalColor = profile?.learning_goal ? GoalColors[profile.learning_goal] : colors.primary;

  useEffect(() => {
    if (!moduleId) return;
    loadQuestions();
  }, [moduleId]);

  const loadQuestions = async () => {
    try {
      const data = await quizService.getQuestionsForModule(moduleId!);
      setQuestions(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Already answered

    const question = questions[currentIndex];
    const correct = index === question.correct_index;

    setSelectedAnswer(index);
    setAnsweredCorrectly(correct);

    if (correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnsweredCorrectly(null);
    } else {
      // Quiz complete
      setIsSaving(true);
      try {
        await quizService.saveResult(userId!, moduleId!, score, questions.length);

        const passed = score / questions.length >= QUIZ_PASS_THRESHOLD;
        if (passed && progress) {
          const updated = await progressService.completeModule(userId!, moduleId!, progress);
          updateProgress(updated);
        }
      } finally {
        setIsSaving(false);
        setState('result');
      }
    }
  };

  if (isLoading) return <LoadingState message="Loading quiz..." fullScreen />;

  const currentQuestion = questions[currentIndex];
  const progressPct = ((currentIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100;
  const finalScore = score;
  const total = questions.length;
  const passed = finalScore / total >= QUIZ_PASS_THRESHOLD;
  const percentage = Math.round((finalScore / total) * 100);

  if (state === 'result') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{passed ? '🎉' : '📖'}</Text>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {passed ? 'Quiz Passed!' : 'Keep Practicing'}
          </Text>
          <Text style={[styles.resultScore, { color: passed ? '#10B981' : '#F59E0B' }]}>
            {finalScore}/{total} correct
          </Text>
          <Text style={[styles.resultPercent, { color: colors.textSecondary }]}>
            {percentage}% — {passed ? `Required ${Math.round(QUIZ_PASS_THRESHOLD * 100)}%` : `Need ${Math.round(QUIZ_PASS_THRESHOLD * 100)}% to pass`}
          </Text>

          <View style={styles.resultProgress}>
            <ProgressBar
              progress={percentage}
              color={passed ? '#10B981' : '#F59E0B'}
              height={12}
              animated
            />
          </View>

          {passed ? (
            <View style={[styles.resultCard, { backgroundColor: '#10B98118', borderColor: '#10B98133' }]}>
              <Text style={[styles.resultCardText, { color: '#10B981' }]}>
                ✅ Module completed! You earned XP and unlocked the next module.
              </Text>
            </View>
          ) : (
            <View style={[styles.resultCard, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B33' }]}>
              <Text style={[styles.resultCardText, { color: '#F59E0B' }]}>
                📖 Review the module lessons and try again. You need {Math.round(QUIZ_PASS_THRESHOLD * 100)}% to pass.
              </Text>
            </View>
          )}

          <View style={styles.resultActions}>
            <Button
              title="Back to Module"
              onPress={() => router.back()}
              variant="outline"
              style={styles.resultBtn}
            />
            {!passed && (
              <Button
                title="Retry Quiz"
                onPress={() => {
                  setCurrentIndex(0);
                  setScore(0);
                  setSelectedAnswer(null);
                  setAnsweredCorrectly(null);
                  setState('question');
                }}
                style={[styles.resultBtn, { backgroundColor: goalColor }]}
              />
            )}
            {passed && (
              <Button
                title="View Roadmap"
                onPress={() => router.push('/(tabs)/roadmap')}
                style={[styles.resultBtn, { backgroundColor: goalColor }]}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <Text style={[styles.scoreText, { color: goalColor }]}>{score} pts</Text>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar progress={progressPct} color={goalColor} height={4} animated={false} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.quizContent}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={[styles.questionNumber, { color: colors.textMuted }]}>
            Q{currentIndex + 1}
          </Text>
          <Text style={[styles.questionText, { color: colors.text }]}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correct_index;
            const showResult = selectedAnswer !== null;

            let bgColor: string = colors.card;
            let borderColor: string = colors.border;
            let textColor: string = colors.text;

            if (showResult) {
              if (isCorrect) {
                bgColor = '#10B98118';
                borderColor = '#10B981';
                textColor = '#10B981';
              } else if (isSelected && !isCorrect) {
                bgColor = '#EF444418';
                borderColor = '#EF4444';
                textColor = '#EF4444';
              }
            } else if (isSelected) {
              bgColor = `${goalColor}18`;
              borderColor = goalColor;
              textColor = goalColor;
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  { backgroundColor: bgColor, borderColor },
                ]}
                onPress={() => handleSelectAnswer(index)}
                disabled={selectedAnswer !== null}
                activeOpacity={0.8}
              >
                <View style={[styles.optionLetter, { backgroundColor: `${borderColor}22` }]}>
                  <Text style={[styles.optionLetterText, { color: textColor }]}>
                    {['A', 'B', 'C', 'D'][index]}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                {showResult && isCorrect && (
                  <Text style={styles.optionCheck}>✓</Text>
                )}
                {showResult && isSelected && !isCorrect && (
                  <Text style={styles.optionCross}>✕</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation */}
        {selectedAnswer !== null && (
          <View
            style={[
              styles.explanation,
              {
                backgroundColor: answeredCorrectly ? '#10B98118' : '#F59E0B18',
                borderColor: answeredCorrectly ? '#10B98133' : '#F59E0B33',
              },
            ]}
          >
            <Text
              style={[
                styles.explanationTitle,
                { color: answeredCorrectly ? '#10B981' : '#F59E0B' },
              ]}
            >
              {answeredCorrectly ? '✓ Correct!' : '✗ Not quite'}
            </Text>
            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}

        {/* Next Button */}
        {selectedAnswer !== null && (
          <Button
            title={currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results →'}
            onPress={handleNext}
            loading={isSaving}
            fullWidth
            size="lg"
            style={{ backgroundColor: goalColor, marginTop: 8 }}
          />
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backText: { fontSize: 20, fontWeight: '600' },
  headerTitle: { fontSize: 15, fontWeight: '600' },
  scoreText: { fontSize: 15, fontWeight: '700' },
  progressContainer: { paddingHorizontal: 0 },
  quizContent: { padding: 20, paddingBottom: 40 },
  questionSection: { marginBottom: 24 },
  questionNumber: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  questionText: { fontSize: 20, fontWeight: '700', lineHeight: 28, letterSpacing: -0.2 },
  options: { gap: 10, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  optionLetterText: { fontSize: 14, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 15, lineHeight: 21 },
  optionCheck: { fontSize: 18, color: '#10B981', marginLeft: 8 },
  optionCross: { fontSize: 18, color: '#EF4444', marginLeft: 8 },
  explanation: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  explanationTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  explanationText: { fontSize: 14, lineHeight: 20 },
  resultContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultEmoji: { fontSize: 64, marginBottom: 16 },
  resultTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  resultScore: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  resultPercent: { fontSize: 15, marginBottom: 24 },
  resultProgress: { width: '100%', marginBottom: 20 },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  resultCardText: { fontSize: 14, lineHeight: 21 },
  resultActions: { flexDirection: 'row', gap: 12, width: '100%' },
  resultBtn: { flex: 1 },
});
