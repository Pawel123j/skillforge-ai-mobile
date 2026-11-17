import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { progressService } from '@/services/progressService';
import { useAuthStore } from '@/stores/authStore';
import { MOCK_PROFILE, MOCK_PROGRESS } from '@/lib/mockData';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { Task, Project } from '@/types';

const mockMaybeSingle = jest.fn();
const mockInsert = jest.fn();
const mockSignUp = jest.fn();
jest.mock('@/lib/supabase', () => ({
  IS_MOCK_MODE: false,
  supabase: {
    auth: { signUp: (...args: unknown[]) => mockSignUp(...args) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
      insert: mockInsert,
    }),
  },
}));

beforeEach(() => {
  jest.restoreAllMocks();
  mockInsert.mockClear();
  useAuthStore.getState().clearSession();
});

test('confirmation-required signup never attempts RLS-protected profile access', async () => {
  mockSignUp.mockResolvedValue({ data: { user: { id: 'new-user', email: 'test@example.org' }, session: null }, error: null });
  const profile = jest.spyOn(profileService, 'getProfile');
  const result = await useAuthStore.getState().signUp('test@example.org', 'test-password', 'Test');
  expect(result).toBe('confirmationRequired');
  expect(profile).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
  expect(useAuthStore.getState()).toMatchObject({ userId: null, profile: null, isLoading: false });
});

test('signup with session loads the trigger-created profile without a duplicate insert', async () => {
  mockSignUp.mockResolvedValue({ data: { user: { id: 'new-user', email: 'test@example.org' }, session: {} }, error: null });
  jest.spyOn(profileService, 'getProfile').mockResolvedValue(MOCK_PROFILE);
  jest.spyOn(progressService, 'getProgress').mockResolvedValue(MOCK_PROGRESS);
  expect(await useAuthStore.getState().signUp('test@example.org', 'test-password', 'Test')).toBe('signedIn');
  expect(mockInsert).not.toHaveBeenCalled();
  expect(useAuthStore.getState()).toMatchObject({ userId: 'new-user', profile: MOCK_PROFILE, isLoading: false });
});

test.each(['network unavailable', 'permission denied'])('progress read failure does not initialize/reset progress: %s', async (message) => {
  mockMaybeSingle.mockResolvedValue({ data: null, error: new Error(message) });
  await expect(progressService.getProgress('user')).rejects.toThrow(message);
  expect(mockInsert).not.toHaveBeenCalled();
});

test('profile read errors are not confused with missing onboarding', async () => {
  mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('offline') });
  await expect(profileService.getProfile('user')).rejects.toThrow('offline');
});

test('Supabase signup errors propagate and clear loading', async () => {
  mockSignUp.mockResolvedValue({ data: {}, error: new Error('signup unavailable') });
  await expect(useAuthStore.getState().signUp('test@example.org', 'test-password', 'Test')).rejects.toThrow('signup unavailable');
  expect(useAuthStore.getState()).toMatchObject({ userId: null, isLoading: false });
});

test('session signup is explicitly distinguished from confirmation', async () => {
  mockSignUp.mockResolvedValue({ data: { user: { id: 'user', email: 'test@example.org' }, session: {} }, error: null });
  expect(await authService.signUp({ email: 'test@example.org', password: 'test-password' })).toMatchObject({ requiresEmailConfirmation: false });
});

test('profile read finishing after logout cannot restore the previous session', async () => {
  let finish!: (profile: typeof MOCK_PROFILE) => void;
  jest.spyOn(authService, 'signIn').mockResolvedValue({ userId: 'previous', email: 'previous@example.org' });
  const profile = jest.spyOn(profileService, 'getProfile').mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  jest.spyOn(progressService, 'getProgress').mockResolvedValue({ ...MOCK_PROGRESS, user_id: 'previous' });
  const pending = useAuthStore.getState().signIn('previous@example.org', 'test-password');
  await Promise.resolve();
  expect(profile).toHaveBeenCalled();
  const rejected = expect(pending).rejects.toThrow('Session changed');
  useAuthStore.getState().clearSession();
  finish({ ...MOCK_PROFILE, user_id: 'previous' });
  await rejected;
  expect(useAuthStore.getState()).toMatchObject({ userId: null, profile: null, progress: null, error: null, isLoading: false });
});

test('failed initialization stays retryable and commits account data only when all reads succeed', async () => {
  jest.spyOn(authService, 'getSession').mockResolvedValue({ userId: 'restored', email: 'restored@example.org' });
  const profile = jest.spyOn(profileService, 'getProfile').mockRejectedValueOnce(new Error('network unavailable'));
  jest.spyOn(progressService, 'getProgress').mockResolvedValue({ ...MOCK_PROGRESS, user_id: 'restored' });
  await useAuthStore.getState().initialize();
  expect(useAuthStore.getState()).toMatchObject({ userId: null, profile: null, error: 'network unavailable', isLoading: false });
  profile.mockResolvedValue({ ...MOCK_PROFILE, user_id: 'restored' });
  await useAuthStore.getState().initialize();
  expect(useAuthStore.getState()).toMatchObject({ userId: 'restored', error: null, isLoading: false });
});

test('logout failure is reported; successful retry clears all account lists', async () => {
  useAuthStore.setState({ userId: MOCK_PROFILE.user_id, profile: MOCK_PROFILE, progress: MOCK_PROGRESS });
  useTaskStore.setState({ tasks: [{ id: 'private-task' } as Task] });
  useProjectStore.setState({ projects: [{ id: 'private-project' } as Project] });
  const signOut = jest.spyOn(authService, 'signOut').mockRejectedValueOnce(new Error('offline'));
  await expect(useAuthStore.getState().signOut()).rejects.toThrow('offline');
  expect(useAuthStore.getState()).toMatchObject({ userId: MOCK_PROFILE.user_id, error: 'offline', isLoading: false });
  signOut.mockResolvedValue(undefined);
  await useAuthStore.getState().signOut();
  expect(useAuthStore.getState()).toMatchObject({ userId: null, profile: null, progress: null });
  expect(useTaskStore.getState().tasks).toEqual([]);
  expect(useProjectStore.getState().projects).toEqual([]);
});

test('previous account profile/progress writes cannot alter the next account', () => {
  useAuthStore.setState({ userId: 'next', profile: { ...MOCK_PROFILE, user_id: 'next' }, progress: { ...MOCK_PROGRESS, user_id: 'next' } });
  useAuthStore.getState().updateProfile({ full_name: 'Old user' }, 'previous');
  useAuthStore.getState().updateProgress({ ...MOCK_PROGRESS, user_id: 'previous', xp: 999 });
  expect(useAuthStore.getState().profile?.full_name).toBe(MOCK_PROFILE.full_name);
  expect(useAuthStore.getState().progress?.user_id).toBe('next');
});

test('a session change during profile loading invalidates the old account immediately', async () => {
  let finish!: (profile: typeof MOCK_PROFILE) => void;
  const session = jest.spyOn(authService, 'getSession').mockResolvedValue({ userId: 'old', email: 'old@example.org' });
  const profile = jest.spyOn(profileService, 'getProfile').mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  jest.spyOn(progressService, 'getProgress').mockResolvedValue(MOCK_PROGRESS);
  const pending = useAuthStore.getState().initialize();
  await Promise.resolve();
  expect(useAuthStore.getState().sessionChanged('new')).toBe(true);
  finish(MOCK_PROFILE);
  await pending;
  expect(useAuthStore.getState()).toMatchObject({ userId: null, profile: null, isLoading: true });
  session.mockResolvedValue({ userId: 'new', email: 'new@example.org' });
  profile.mockRejectedValueOnce(new Error('new profile unavailable'));
  await useAuthStore.getState().initialize();
  expect(useAuthStore.getState()).toMatchObject({ userId: null, profile: null, error: 'new profile unavailable', isLoading: false });
});

test('restoring a different session clears old lists even if the new profile fails', async () => {
  useAuthStore.setState({ userId: 'old', profile: MOCK_PROFILE, progress: MOCK_PROGRESS });
  useTaskStore.setState({ tasks: [{ id: 'old-private-task' } as Task] });
  jest.spyOn(authService, 'getSession').mockResolvedValue({ userId: 'new', email: 'new@example.org' });
  jest.spyOn(profileService, 'getProfile').mockRejectedValue(new Error('offline'));
  jest.spyOn(progressService, 'getProgress').mockResolvedValue(MOCK_PROGRESS);
  await useAuthStore.getState().initialize();
  expect(useAuthStore.getState()).toMatchObject({ userId: null, profile: null, progress: null, error: 'offline' });
  expect(useTaskStore.getState().tasks).toEqual([]);
});
