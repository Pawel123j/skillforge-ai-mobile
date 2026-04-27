import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_PROGRESS } from '@/lib/mockData';
import { UserProgress } from '@/types';
import { XP_VALUES } from '@/constants';

export const progressService = {
  async getProgress(userId: string): Promise<UserProgress> {
    if (IS_MOCK_MODE) return { ...MOCK_PROGRESS, user_id: userId };

    const { data, error } = await supabase!
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Initialize progress for new user
      return progressService.initProgress(userId);
    }

    return data as UserProgress;
  },

  async initProgress(userId: string): Promise<UserProgress> {
    if (IS_MOCK_MODE) return MOCK_PROGRESS;

    const initial: Omit<UserProgress, 'id'> = {
      user_id: userId,
      completed_lessons: [],
      completed_modules: [],
      xp: 0,
      streak_days: 0,
      last_activity_date: null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase!
      .from('user_progress')
      .insert(initial)
      .select()
      .single();

    if (error) throw error;
    return data as UserProgress;
  },

  async completeLesson(userId: string, lessonId: string, currentProgress: UserProgress): Promise<UserProgress> {
    if (currentProgress.completed_lessons.includes(lessonId)) return currentProgress;

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = currentProgress.last_activity_date;
    const isNewDay = lastActivity !== today;

    let newStreak = currentProgress.streak_days;
    if (isNewDay) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = lastActivity === yesterday ? newStreak + 1 : 1;
    }

    const updated: Partial<UserProgress> = {
      completed_lessons: [...currentProgress.completed_lessons, lessonId],
      xp: currentProgress.xp + XP_VALUES.LESSON_COMPLETE + (isNewDay ? XP_VALUES.STREAK_BONUS : 0),
      streak_days: newStreak,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    };

    if (IS_MOCK_MODE) {
      return { ...currentProgress, ...updated };
    }

    const { data, error } = await supabase!
      .from('user_progress')
      .update(updated)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProgress;
  },

  async completeModule(userId: string, moduleId: string, currentProgress: UserProgress): Promise<UserProgress> {
    if (currentProgress.completed_modules.includes(moduleId)) return currentProgress;

    const updated: Partial<UserProgress> = {
      completed_modules: [...currentProgress.completed_modules, moduleId],
      xp: currentProgress.xp + XP_VALUES.QUIZ_PASS,
      updated_at: new Date().toISOString(),
    };

    if (IS_MOCK_MODE) {
      return { ...currentProgress, ...updated };
    }

    const { data, error } = await supabase!
      .from('user_progress')
      .update(updated)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProgress;
  },
};
