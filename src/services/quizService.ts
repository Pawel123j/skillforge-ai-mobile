import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_QUIZ_QUESTIONS } from '@/lib/mockData';
import { QuizQuestion, QuizResult } from '@/types';
import { QUIZ_PASS_THRESHOLD } from '@/constants';

export const quizService = {
  async getQuestionsForModule(moduleId: string): Promise<QuizQuestion[]> {
    if (IS_MOCK_MODE) {
      return MOCK_QUIZ_QUESTIONS[moduleId] ?? generateGenericQuestions(moduleId);
    }

    const { data, error } = await supabase!
      .from('quiz_questions')
      .select('*')
      .eq('module_id', moduleId)
      .order('id');

    if (error) throw error;
    return data as QuizQuestion[];
  },

  async saveResult(
    userId: string,
    moduleId: string,
    score: number,
    totalQuestions: number
  ): Promise<QuizResult> {
    const passed = score / totalQuestions >= QUIZ_PASS_THRESHOLD;

    const result: QuizResult = {
      id: `result-${Date.now()}`,
      user_id: userId,
      module_id: moduleId,
      score,
      total_questions: totalQuestions,
      passed,
      taken_at: new Date().toISOString(),
    };

    if (IS_MOCK_MODE) return result;

    const { data, error } = await supabase!
      .from('quiz_results')
      .insert({
        user_id: userId,
        module_id: moduleId,
        score,
        total_questions: totalQuestions,
        passed,
        taken_at: result.taken_at,
      })
      .select()
      .single();

    if (error) throw error;
    return data as QuizResult;
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
