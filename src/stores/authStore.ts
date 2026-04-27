import { create } from 'zustand';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { progressService } from '@/services/progressService';
import { Profile, UserProgress } from '@/types';
import { IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_USER_ID, MOCK_PROFILE, MOCK_PROGRESS } from '@/lib/mockData';

interface AuthState {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  progress: UserProgress | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  updateProgress: (progress: UserProgress) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  email: null,
  profile: null,
  progress: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      if (IS_MOCK_MODE) {
        set({
          userId: MOCK_USER_ID,
          email: 'demo@skillforge.ai',
          profile: MOCK_PROFILE,
          progress: MOCK_PROGRESS,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      const session = await authService.getSession();
      if (session) {
        await get().loadProfile(session.userId);
        set({ userId: session.userId, email: session.email });
      }
    } catch {
      // Session not found — user needs to log in
    } finally {
      set({ isInitialized: true, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.signIn({ email, password });
      await get().loadProfile(result.userId);
      set({ userId: result.userId, email: result.email });
    } catch (err: any) {
      set({ error: err.message ?? 'Login failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.signUp({ email, password, fullName });
      const profile = await profileService.createProfile(result.userId, fullName);
      const progress = await progressService.getProgress(result.userId);
      set({ userId: result.userId, email: result.email, profile, progress });
    } catch (err: any) {
      set({ error: err.message ?? 'Registration failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ userId: null, email: null, profile: null, progress: null });
    } catch (err: any) {
      set({ error: err.message ?? 'Logout failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadProfile: async (userId) => {
    const [profile, progress] = await Promise.all([
      profileService.getProfile(userId),
      progressService.getProgress(userId),
    ]);
    set({ profile, progress });
  },

  updateProfile: (updates) => {
    const current = get().profile;
    if (current) set({ profile: { ...current, ...updates } });
  },

  updateProgress: (progress) => set({ progress }),

  clearError: () => set({ error: null }),
}));
