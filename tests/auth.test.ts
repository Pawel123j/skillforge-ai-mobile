import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { progressService } from '@/services/progressService';
import { useAuthStore } from '@/stores/authStore';
import { MOCK_PROFILE, MOCK_PROGRESS } from '@/lib/mockData';

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
  useAuthStore.setState({ userId: null, email: null, profile: null, progress: null, isLoading: false });
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
