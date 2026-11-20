import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_QUIZ_QUESTIONS } from '@/lib/mockData';
import { QuizAnswerFeedback, QuizQuestion, QuizResult, UserProgress } from '@/types';
import { QUIZ_PASS_THRESHOLD } from '@/constants';

export const quizService = {
  async getQuestionsForModule(moduleId: string): Promise<QuizQuestion[]> {
    if (IS_MOCK_MODE) {
      return MOCK_QUIZ_QUESTIONS[moduleId] ?? generateGenericQuestions(moduleId);
    }

    const { data, error } = await supabase!
      .from('quiz_questions')
      // SF-02: correct_index i explanation nie są dostępne do odczytu (uprawnienia kolumn).
      .select('id, module_id, question, options')
      .eq('module_id', moduleId)
      .order('id');

    if (error) throw error;
    return data as QuizQuestion[];
  },

  /**
   * Zapisuje odpowiedź na serwerze i zwraca informację zwrotną. Liczy się pierwsza
   * odpowiedź w danym podejściu — ponowne wywołanie jej nie zmienia (SF-02).
   */
  async answerQuestion(
    attemptId: string,
    question: QuizQuestion,
    chosenIndex: number
  ): Promise<QuizAnswerFeedback> {
    if (IS_MOCK_MODE) {
      const correctIndex = question.correct_index ?? 0;
      return {
        correct: chosenIndex === correctIndex,
        chosen_index: chosenIndex,
        correct_index: correctIndex,
        explanation: question.explanation ?? '',
      };
    }

    const { data, error } = await supabase!.rpc('answer_quiz_question', {
      p_attempt_id: attemptId,
      p_question_id: question.id,
      p_chosen_index: chosenIndex,
    });
    if (error) throw error;
    return data as QuizAnswerFeedback;
  },

  /**
   * Kończy podejście: wynik i XP liczy serwer z zapisanych odpowiedzi (SF-02).
   * W trybie mock wynik pochodzi z lokalnie policzonych poprawnych odpowiedzi.
   */
  async finishQuiz(
    attemptId: string,
    userId: string,
    moduleId: string,
    localCorrect: number,
    totalQuestions: number
  ): Promise<{ result: QuizResult; progress: UserProgress | null }> {
    if (IS_MOCK_MODE) {
      return {
        result: {
          id: `result-${Date.now()}`,
          user_id: userId,
          module_id: moduleId,
          score: localCorrect,
          total_questions: totalQuestions,
          passed: localCorrect / totalQuestions >= QUIZ_PASS_THRESHOLD,
          taken_at: new Date().toISOString(),
        },
        progress: null,
      };
    }

    const { data, error } = await supabase!.rpc('finish_quiz', {
      p_attempt_id: attemptId,
      p_module_id: moduleId,
    });
    if (error) throw error;
    return data as { result: QuizResult; progress: UserProgress | null };
  },

  async getResultsForUser(userId: string): Promise<QuizResult[]> {
    if (IS_MOCK_MODE) return [];

    const { data, error } = await supabase!
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false });

    if (error) throw error;
    return data as QuizResult[];
  },
};

// Generates fallback questions if no specific questions exist for a module
function generateGenericQuestions(moduleId: string): QuizQuestion[] {
  return [
    {
      id: `${moduleId}-generic-1`,
      module_id: moduleId,
      question: 'Which concept is most important when learning this module?',
      options: ['Practice regularly', 'Memorize syntax', 'Copy-paste code', 'Skip fundamentals'],
      correct_index: 0,
      explanation: 'Regular practice is the most effective way to solidify programming skills.',
    },
    {
      id: `${moduleId}-generic-2`,
      module_id: moduleId,
      question: 'What is the best approach to debug code?',
      options: [
        'Guess and change random things',
        'Read error messages and isolate the problem',
        'Restart and hope it works',
        'Ask someone else immediately',
      ],
      correct_index: 1,
      explanation: 'Reading error messages and isolating the problem systematically is the key to effective debugging.',
    },
    {
      id: `${moduleId}-generic-3`,
      module_id: moduleId,
      question: 'How should you approach a new programming concept?',
      options: [
        'Read documentation, then build a small project',
        'Watch videos without coding along',
        'Memorize all the theory first',
        'Jump straight to complex projects',
      ],
      correct_index: 0,
      explanation: 'Reading docs then building something small helps you learn and retain concepts effectively.',
    },
  ];
}

/** Identyfikator podejścia. Nie musi być tajny — własność i jednorazowość egzekwuje serwer. */
export function newAttemptId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
