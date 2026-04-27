import { TaskStatus, ProjectStatus, Difficulty, LearningGoal } from '@/types';
import { GoalColors, GoalLabels, GoalIcons } from '@/constants';

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return `Due ${formatDate(dateStr)}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function formatHours(hours: number): string {
  return `${hours}h`;
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };
  return labels[status];
}

export function getProjectStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    idea: 'Idea',
    building: 'Building',
    completed: 'Completed',
  };
  return labels[status];
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  const labels: Record<Difficulty, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return labels[difficulty];
}

// ─── Color Helpers ────────────────────────────────────────────────────────────

export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    todo: '#94A3B8',
    in_progress: '#F59E0B',
    done: '#10B981',
  };
  return colors[status];
}

export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    idea: '#94A3B8',
    building: '#F59E0B',
    completed: '#10B981',
  };
  return colors[status];
}

export function getDifficultyColor(difficulty: Difficulty): string {
  const colors: Record<Difficulty, string> = {
    beginner: '#10B981',
    intermediate: '#F59E0B',
    advanced: '#EF4444',
  };
  return colors[difficulty];
}

export function getGoalColor(goal: LearningGoal): string {
  return GoalColors[goal];
}

export function getGoalLabel(goal: LearningGoal): string {
  return GoalLabels[goal];
}

export function getGoalIcon(goal: LearningGoal): string {
  return GoalIcons[goal];
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function calcProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getXpLevel(xp: number): { level: number; title: string; nextLevelXp: number } {
  const levels = [
    { threshold: 0, title: 'Newcomer' },
    { threshold: 100, title: 'Apprentice' },
    { threshold: 300, title: 'Learner' },
    { threshold: 600, title: 'Developer' },
    { threshold: 1000, title: 'Practitioner' },
    { threshold: 1500, title: 'Engineer' },
    { threshold: 2500, title: 'Senior Dev' },
    { threshold: 5000, title: 'Expert' },
  ];

  let currentLevel = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].threshold) {
      currentLevel = i;
      break;
    }
  }

  const nextLevelXp =
    currentLevel < levels.length - 1 ? levels[currentLevel + 1].threshold : levels[currentLevel].threshold;

  return {
    level: currentLevel + 1,
    title: levels[currentLevel].title,
    nextLevelXp,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
