import { LearningGoal, DailyTime, SkillLevel } from '@/types';

// ─── Colors ───────────────────────────────────────────────────────────────────

export const Colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarActive: '#6366F1',
    tabBarInactive: '#94A3B8',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    border: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#818CF8',
    primaryLight: '#1E1B4B',
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FCD34D',
    warningLight: '#451A03',
    error: '#F87171',
    errorLight: '#450A0A',
    card: '#1E293B',
    tabBar: '#1E293B',
    tabBarActive: '#818CF8',
    tabBarInactive: '#64748B',
  },
} as const;

export const GoalColors: Record<LearningGoal, string> = {
  frontend: '#6366F1',
  backend: '#10B981',
  mobile: '#F59E0B',
  cybersecurity: '#EF4444',
  data_analyst: '#8B5CF6',
  python: '#3B82F6',
};

export const GoalLabels: Record<LearningGoal, string> = {
  frontend: 'Frontend Developer',
  backend: 'Backend Developer',
  mobile: 'Mobile Developer',
  cybersecurity: 'Cybersecurity',
  data_analyst: 'Data Analyst',
  python: 'Python Developer',
};

export const GoalIcons: Record<LearningGoal, string> = {
  frontend: '🎨',
  backend: '⚙️',
  mobile: '📱',
  cybersecurity: '🔒',
  data_analyst: '📊',
  python: '🐍',
};

export const SkillLevelLabels: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
};

export const DailyTimeLabels: Record<DailyTime, string> = {
  15: '15 min / day',
  30: '30 min / day',
  60: '1 hour / day',
  90: '1.5 hours / day',
};

// ─── XP System ────────────────────────────────────────────────────────────────

export const XP_VALUES = {
  LESSON_COMPLETE: 50,
  TASK_COMPLETE: 25,
  PROJECT_COMPLETE: 200,
  QUIZ_PASS: 100,
  STREAK_BONUS: 10,
} as const;

// ─── App ──────────────────────────────────────────────────────────────────────

export const APP_NAME = 'SkillForge AI';

export const QUIZ_PASS_THRESHOLD = 0.7; // 70% to pass
