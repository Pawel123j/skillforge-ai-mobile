import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_LEARNING_PATHS, MOCK_MODULES, MOCK_LESSONS } from '@/lib/mockData';
import { LearningPath, Module, Lesson, LearningGoal, ModuleWithProgress, LessonWithProgress } from '@/types';

export const roadmapService = {
  async getLearningPaths(): Promise<LearningPath[]> {
    if (IS_MOCK_MODE) return MOCK_LEARNING_PATHS;

    const { data, error } = await supabase!.from('learning_paths').select('*').order('goal');
    if (error) throw error;
    return data as LearningPath[];
  },

  async getModulesForGoal(goal: LearningGoal, completedModules: string[], completedLessons: string[]): Promise<ModuleWithProgress[]> {
    if (IS_MOCK_MODE) {
      const modules = MOCK_MODULES[goal] ?? [];
      return buildModulesWithProgress(modules, completedModules, completedLessons);
    }

    const path = await supabase!
      .from('learning_paths')
      .select('id')
      .eq('goal', goal)
      .single();

    if (path.error) throw path.error;

    const { data, error } = await supabase!
      .from('modules')
      .select('*')
      .eq('learning_path_id', path.data.id)
      .order('order_index');

    if (error) throw error;
    return buildModulesWithProgress(data as Module[], completedModules, completedLessons);
  },

  async getLessonsForModule(moduleId: string, completedLessons: string[]): Promise<LessonWithProgress[]> {
    if (IS_MOCK_MODE) {
      const lessons = MOCK_LESSONS.filter((l) => l.module_id === moduleId);
      return lessons.map((l) => ({
        ...l,
        is_completed: completedLessons.includes(l.id),
        completed_at: completedLessons.includes(l.id) ? new Date().toISOString() : null,
      }));
    }

    const { data, error } = await supabase!
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (error) throw error;

    return (data as Lesson[]).map((l) => ({
      ...l,
      is_completed: completedLessons.includes(l.id),
      completed_at: completedLessons.includes(l.id) ? new Date().toISOString() : null,
    }));
  },

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    if (IS_MOCK_MODE) {
      return MOCK_LESSONS.find((l) => l.id === lessonId) ?? null;
    }

    const { data, error } = await supabase!
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (error) return null;
    return data as Lesson;
  },
};

function buildModulesWithProgress(
  modules: Module[],
  completedModules: string[],
  completedLessons: string[]
): ModuleWithProgress[] {
  return modules.map((mod, index) => {
    const moduleLessons = MOCK_LESSONS.filter((l) => l.module_id === mod.id);
    const totalLessons = moduleLessons.length || 4; // fallback count for non-mock
    const completedCount = moduleLessons.filter((l) => completedLessons.includes(l.id)).length;

    const isCompleted = completedModules.includes(mod.id);
    // First module always unlocked; subsequent ones unlock when previous is complete
    const isLocked = index > 0 && !completedModules.includes(modules[index - 1].id);

    return {
      ...mod,
      completed_lessons: completedCount,
      total_lessons: totalLessons,
      is_completed: isCompleted,
      is_locked: isLocked,
    };
  });
}
