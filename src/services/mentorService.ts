import { MentorInsight, UserProgress, Profile, Task, Project } from '@/types';

// Rule-based mentor engine — architecture ready to swap in OpenAI API later.
export function generateMentorInsight(
  profile: Profile,
  progress: UserProgress,
  tasks: Task[],
  projects: Project[]
): MentorInsight {
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = progress.last_activity_date;
  const daysSinceActivity = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
    : 999;

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const buildingProjects = projects.filter((p) => p.status === 'building');
  const lessonsCount = progress.completed_lessons.length;

  // Streak milestone
  if (progress.streak_days >= 7 && progress.streak_days % 7 === 0) {
    return {
      id: 'mentor-streak',
      type: 'achievement',
      title: `${progress.streak_days}-Day Streak! 🔥`,
      message: `You've maintained a ${progress.streak_days}-day learning streak. Your consistency is building real habits. Keep going!`,
      icon: '🏆',
      action_label: 'View Roadmap',
      action_route: '/(tabs)/roadmap',
    };
  }

  // Inactive for 3+ days
  if (daysSinceActivity >= 3) {
    return {
      id: 'mentor-inactive',
      type: 'warning',
      title: 'Ready to Continue?',
      message: `You haven't completed a lesson in ${daysSinceActivity} days. Try a 20-minute coding session today — even small steps count!`,
      icon: '⏰',
      action_label: 'Continue Learning',
      action_route: '/(tabs)/roadmap',
    };
  }

  // Has lessons but no projects started
  if (lessonsCount >= 3 && buildingProjects.length === 0 && completedProjects.length === 0) {
    return {
      id: 'mentor-project',
      type: 'tip',
      title: 'Time to Build Something',
      message: `You have ${lessonsCount} completed lessons but no active projects. Apply your knowledge — start a portfolio project this week!`,
      icon: '🚀',
      action_label: 'Browse Projects',
      action_route: '/(tabs)/projects',
    };
  }

  // Many pending tasks
  if (pendingTasks.length >= 5) {
    return {
      id: 'mentor-tasks',
      type: 'warning',
      title: 'Clear Your Task List',
      message: `You have ${pendingTasks.length} pending tasks. Focus on completing 2-3 tasks today to build momentum.`,
      icon: '📋',
      action_label: 'View Tasks',
      action_route: '/(tabs)/tasks',
    };
  }

  // High XP milestone
  if (progress.xp >= 500 && progress.xp < 600) {
    return {
      id: 'mentor-xp',
      type: 'achievement',
      title: '500 XP Milestone!',
      message: `You've earned 500 XP! You're making real progress. Consider sharing your journey on GitHub to build your portfolio.`,
      icon: '⭐',
      action_label: 'View Projects',
      action_route: '/(tabs)/projects',
    };
  }

  // Project building — encourage to finish
  if (buildingProjects.length > 0) {
    return {
      id: 'mentor-finish',
      type: 'tip',
      title: 'Finish What You Started',
      message: `You're building "${buildingProjects[0].title}". Complete it and push to GitHub — finished projects are your best portfolio pieces.`,
      icon: '🏗️',
      action_label: 'View Projects',
      action_route: '/(tabs)/projects',
    };
  }

  // Module progress near complete
  const completedCount = progress.completed_lessons.length;
  if (completedCount > 0 && completedCount % 4 === 0) {
    return {
      id: 'mentor-module-near',
      type: 'tip',
      title: 'Module Almost Done!',
      message: `You've completed ${completedCount} lessons. You're close to finishing a module — take the quiz to earn XP and unlock the next level.`,
      icon: '🎯',
      action_label: 'View Roadmap',
      action_route: '/(tabs)/roadmap',
    };
  }

  // Default daily encouragement
  const encouragements: MentorInsight[] = [
    {
      id: 'mentor-daily-1',
      type: 'encouragement',
      title: 'Keep the Momentum Going',
      message: `Your streak is at ${progress.streak_days} days. Every lesson you complete brings you one step closer to your goal.`,
      icon: '💡',
      action_label: 'Continue Learning',
      action_route: '/(tabs)/roadmap',
    },
    {
      id: 'mentor-daily-2',
      type: 'encouragement',
      title: 'Small Steps, Big Results',
      message: `Consistency beats intensity. Even 15 minutes of focused learning today will compound into mastery over time.`,
      icon: '📚',
      action_label: 'View Roadmap',
      action_route: '/(tabs)/roadmap',
    },
    {
      id: 'mentor-daily-3',
      type: 'tip',
      title: 'Code Review Tip',
      message: `After completing a lesson, try to explain the concept in your own words. Teaching is the best way to test your understanding.`,
      icon: '🧠',
    },
  ];

  const index = progress.streak_days % encouragements.length;
  return encouragements[index];
}

export function generateAllInsights(
  profile: Profile,
  progress: UserProgress,
  tasks: Task[],
  projects: Project[]
): MentorInsight[] {
  const insights: MentorInsight[] = [];
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = progress.last_activity_date;
  const daysSinceActivity = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
    : 999;

  if (daysSinceActivity >= 3) {
    insights.push({
      id: 'insight-inactive',
      type: 'warning',
      title: 'Resume Your Learning',
      message: `You haven't been active in ${daysSinceActivity} days. A short session today will keep your momentum alive.`,
      icon: '⏰',
      action_label: 'Start Learning',
      action_route: '/(tabs)/roadmap',
    });
  }

  if (progress.streak_days >= 3) {
    insights.push({
      id: 'insight-streak',
      type: 'achievement',
      title: `${progress.streak_days}-Day Streak!`,
      message: `You're on a ${progress.streak_days}-day learning streak. Your consistency is paying off!`,
      icon: '🔥',
    });
  }

  const noProjects = projects.filter((p) => p.status !== 'idea').length === 0;
  if (progress.completed_lessons.length >= 3 && noProjects) {
    insights.push({
      id: 'insight-no-projects',
      type: 'tip',
      title: 'Start a Portfolio Project',
      message: `You have ${progress.completed_lessons.length} completed lessons but no active projects. Build something to showcase your skills!`,
      icon: '🚀',
      action_label: 'Browse Projects',
      action_route: '/(tabs)/projects',
    });
  }

  if (progress.xp >= 200) {
    insights.push({
      id: 'insight-xp',
      type: 'achievement',
      title: `${progress.xp} XP Earned`,
      message: `Great progress! You've earned ${progress.xp} XP. Keep completing lessons and quizzes to level up faster.`,
      icon: '⭐',
    });
  }

  insights.push({
    id: 'insight-tip',
    type: 'tip',
    title: 'Developer Tip',
    message: 'Build projects, not just exercises. Real projects force you to solve real problems and make your portfolio stand out.',
    icon: '💡',
  });

  return insights;
}
