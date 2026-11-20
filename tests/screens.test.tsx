import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LessonScreen from '../app/lesson/[id]';
import ModuleScreen from '../app/module/[id]';
import QuizScreen from '../app/quiz/[moduleId]';
import RoadmapScreen from '../app/(tabs)/roadmap';
import OnboardingScreen from '../app/onboarding';
import { useAuthStore } from '@/stores/authStore';
import { MOCK_PROFILE, MOCK_PROGRESS, MOCK_LESSONS, MOCK_MODULES } from '@/lib/mockData';
import { roadmapService } from '@/services/roadmapService';
import { quizService } from '@/services/quizService';
import { profileService } from '@/services/profileService';
import { GoalLabels, SkillLevelLabels, DailyTimeLabels } from '@/constants';

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
let mockParams = { id: 'lesson-test', moduleId: 'module-test' };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/lib/supabase', () => ({ IS_MOCK_MODE: true, supabase: null }));
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

beforeEach(() => {
  jest.restoreAllMocks();
  mockParams = { id: 'lesson-test', moduleId: 'module-test' };
  useAuthStore.setState({ userId: 'demo-user', profile: MOCK_PROFILE, progress: { ...MOCK_PROGRESS, completed_lessons: [] } });
});

test('missing lesson resolves loading to an error', async () => {
  jest.spyOn(roadmapService, 'getLessonById').mockResolvedValue(null);
  await render(<LessonScreen />);
  expect(await screen.findByText(/Lesson unavailable/)).toBeTruthy();
  expect(screen.queryByText('Loading lesson...')).toBeNull();
});

test('lesson completion follows updated user progress', async () => {
  jest.spyOn(roadmapService, 'getLessonById').mockResolvedValue({ ...MOCK_LESSONS[0], id: mockParams.id });
  await render(<LessonScreen />);
  expect(await screen.findByText('Mark as Completed ✓')).toBeTruthy();
  await act(() => useAuthStore.getState().updateProgress({ ...MOCK_PROGRESS, completed_lessons: [mockParams.id] }));
  expect(screen.getByText('Lesson Completed!')).toBeTruthy();
});

test('changing lesson ids hides the old lesson until the new request completes', async () => {
  const load = jest.spyOn(roadmapService, 'getLessonById').mockResolvedValue({ ...MOCK_LESSONS[0], title: 'First lesson' });
  const view = await render(<LessonScreen />);
  await screen.findByText('First lesson');
  let finish!: (value: typeof MOCK_LESSONS[number]) => void;
  load.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  mockParams = { ...mockParams, id: 'second-lesson' };
  await view.rerender(<LessonScreen />);
  expect(screen.queryByText('First lesson')).toBeNull();
  expect(screen.getByText('Loading lesson...')).toBeTruthy();
  await act(() => finish({ ...MOCK_LESSONS[0], id: 'second-lesson', title: 'Second lesson' }));
  expect(await screen.findByText('Second lesson')).toBeTruthy();
});

test('changing quiz modules resets answered questions and score', async () => {
  const question = { id: 'q1', module_id: 'first', question: 'First question', options: ['Correct answer', 'Other answer'], correct_index: 0, explanation: 'First explanation' };
  jest.spyOn(quizService, 'getQuestionsForModule').mockResolvedValue([question]);
  const view = await render(<QuizScreen />);
  await screen.findByText('First question');
  await fireEvent.press(screen.getByText('Correct answer'));
  expect(screen.getByText('✓ Correct!')).toBeTruthy();
  jest.spyOn(quizService, 'getQuestionsForModule').mockResolvedValue([{ ...question, id: 'q2', question: 'Second question' }]);
  mockParams = { ...mockParams, moduleId: 'second' };
  await view.rerender(<QuizScreen />);
  await screen.findByText('Second question');
  expect(screen.queryByText('✓ Correct!')).toBeNull();
  expect(screen.queryByText('See Results →')).toBeNull();
});

test('module uses service metadata and refreshes completed lessons without remounting', async () => {
  jest.spyOn(roadmapService, 'getModuleById').mockResolvedValue({ ...Object.values(MOCK_MODULES).flat()[0], title: 'Server module' });
  const load = jest.spyOn(roadmapService, 'getLessonsForModule').mockResolvedValue([]);
  await render(<ModuleScreen />);
  expect(await screen.findByText('Server module')).toBeTruthy();
  await act(() => useAuthStore.getState().updateProgress({ ...MOCK_PROGRESS, completed_lessons: ['new-lesson'] }));
  await waitFor(() => expect(load).toHaveBeenLastCalledWith(mockParams.id, ['new-lesson']));
  await screen.findByText('Server module');
});

test.each(['empty', 'failed'])('%s quiz displays an error instead of dereferencing a missing question', async (outcome) => {
  const load = jest.spyOn(quizService, 'getQuestionsForModule');
  if (outcome === 'empty') load.mockResolvedValue([]);
  else load.mockRejectedValue(new Error('offline'));
  await render(<QuizScreen />);
  expect(await screen.findByText(/Quiz unavailable/)).toBeTruthy();
});

test('roadmap reloads when completion unlocks the next module', async () => {
  const load = jest.spyOn(roadmapService, 'getModulesForGoal').mockResolvedValue([]);
  await render(<RoadmapScreen />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  await act(() => useAuthStore.getState().updateProgress({ ...MOCK_PROGRESS, completed_modules: ['first-module'] }));
  await waitFor(() => expect(load).toHaveBeenLastCalledWith(MOCK_PROFILE.learning_goal, ['first-module'], MOCK_PROGRESS.completed_lessons));
});

test('failed onboarding stays on the form and allows a retry', async () => {
  jest.spyOn(profileService, 'completeOnboarding').mockRejectedValue(new Error('offline'));
  await render(<OnboardingScreen />);
  await fireEvent.press(screen.getByText(GoalLabels.frontend));
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.press(screen.getByText(SkillLevelLabels.beginner));
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.press(screen.getByText(DailyTimeLabels[30]));
  await fireEvent.press(screen.getByText('Start Learning 🚀'));
  expect(await screen.findByText(/Could not save your learning plan/)).toBeTruthy();
  expect(mockRouter.replace).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Start Learning 🚀' })).toBeEnabled();
});
