// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export type LearningGoal =
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'cybersecurity'
  | 'data_analyst'
  | 'python';

export type SkillLevel = 'beginner' | 'intermediate';

export type DailyTime = 15 | 30 | 60 | 90;

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  learning_goal: LearningGoal | null;
  skill_level: SkillLevel | null;
  daily_time_minutes: DailyTime | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Learning Path ─────────────────────────────────────────────────────────────

export interface LearningPath {
  id: string;
  goal: LearningGoal;
  title: string;
  description: string;
  icon: string;
  color: string;
  total_modules: number;
  estimated_hours: number;
  created_at: string;
}

// ─── Module ───────────────────────────────────────────────────────────────────

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Module {
  id: string;
  learning_path_id: string;
  title: string;
  description: string;
  order_index: number;
  difficulty: Difficulty;
  estimated_hours: number;
  icon: string;
  created_at: string;
}

export interface ModuleWithProgress extends Module {
  completed_lessons: number;
  total_lessons: number;
  is_completed: boolean;
  is_locked: boolean;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  order_index: number;
  estimated_minutes: number;
  type: 'reading' | 'video' | 'exercise' | 'project';
  created_at: string;
}

export interface LessonWithProgress extends Lesson {
  is_completed: boolean;
  completed_at: string | null;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  module_id: string | null;
  module_title: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskFormData = {
  title: string;
  description: string;
  module_id?: string;
  module_title?: string;
  status: TaskStatus;
  due_date?: string;
};

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'idea' | 'building' | 'completed';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal: LearningGoal | null;
  status: ProjectStatus;
  github_url: string | null;
  is_suggested: boolean;
  tech_stack: string[];
  created_at: string;
  updated_at: string;
}

export type ProjectFormData = {
  title: string;
  description: string;
  status: ProjectStatus;
  github_url?: string;
  tech_stack: string[];
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  module_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  module_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  taken_at: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface UserProgress {
  id: string;
  user_id: string;
  completed_lessons: string[];
  completed_modules: string[];
  xp: number;
  streak_days: number;
  last_activity_date: string | null;
  updated_at: string;
}

// ─── Mentor ───────────────────────────────────────────────────────────────────

export interface MentorInsight {
  id: string;
  type: 'encouragement' | 'warning' | 'tip' | 'achievement';
  title: string;
  message: string;
  icon: string;
  action_label?: string;
  action_route?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  xp: number;
  streak: number;
  completed_lessons: number;
  completed_projects: number;
  current_module: ModuleWithProgress | null;
  progress_percentage: number;
  today_task: Task | null;
  mentor_insight: MentorInsight;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  index: undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'onboarding/index': undefined;
  '(tabs)/dashboard': undefined;
  '(tabs)/roadmap': undefined;
  '(tabs)/tasks': undefined;
  '(tabs)/projects': undefined;
  '(tabs)/mentor': undefined;
  '(tabs)/profile': undefined;
  'lesson/[id]': { id: string };
  'module/[id]': { id: string };
  'quiz/[moduleId]': { moduleId: string };
};
