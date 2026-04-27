import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_PROFILE } from '@/lib/mockData';
import { Profile, LearningGoal, SkillLevel, DailyTime } from '@/types';

export interface OnboardingData {
  learning_goal: LearningGoal;
  skill_level: SkillLevel;
  daily_time_minutes: DailyTime;
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    if (IS_MOCK_MODE) return MOCK_PROFILE;

    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data as Profile;
  },

  async createProfile(userId: string, fullName: string): Promise<Profile> {
    if (IS_MOCK_MODE) return { ...MOCK_PROFILE, user_id: userId, full_name: fullName };

    const profile = {
      user_id: userId,
      full_name: fullName,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase!
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async completeOnboarding(userId: string, data: OnboardingData): Promise<void> {
    if (IS_MOCK_MODE) return;

    const { error } = await supabase!
      .from('profiles')
      .update({
        ...data,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'full_name' | 'learning_goal' | 'daily_time_minutes'>>
  ): Promise<void> {
    if (IS_MOCK_MODE) return;

    const { error } = await supabase!
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
  },
};
