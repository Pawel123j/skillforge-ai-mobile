import { create } from 'zustand';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { progressService } from '@/services/progressService';
import { Profile, UserProgress } from '@/types';
import { useTaskStore } from './taskStore';
import { useProjectStore } from './projectStore';
import { useToastStore } from './toastStore';

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
  signUp: (email: string, password: string, fullName: string) => Promise<'signedIn' | 'confirmationRequired'>;
  signOut: () => Promise<void>;
  clearSession: () => void;
  sessionChanged: (userId: string | null) => boolean;
  updateProfile: (updates: Partial<Profile>, userId: string) => void;
  updateProgress: (progress: UserProgress) => void;
  clearError: () => void;
}

let sessionVersion = 0;
export const captureSession = () => {
  const version = sessionVersion;
  return () => version === sessionVersion;
};
const resetLists = () => {
  useTaskStore.getState().reset();
  useProjectStore.getState().reset();
  useToastStore.setState({ toasts: [] });
};
const readProfile = async (userId: string) => {
  const [profile, progress] = await Promise.all([
    profileService.getProfile(userId), progressService.getProgress(userId),
  ]);
  return { profile, progress };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null, email: null, profile: null, progress: null,
  isLoading: false, isInitialized: false, error: null,

  clearSession: () => {
    sessionVersion++;
    resetLists();
    set({ userId: null, email: null, profile: null, progress: null,
      isLoading: false, isInitialized: true, error: null });
  },
  sessionChanged: (userId) => {
    if (userId !== null && userId === get().userId) return false;
    get().clearSession();
    if (userId) set({ isLoading: true, isInitialized: false });
    return userId !== null;
  },

  initialize: async () => {
    const version = ++sessionVersion;
    set({ isLoading: true, error: null });
    try {
      const session = await authService.getSession();
      if (version !== sessionVersion) return;
      if (!session) {
        get().clearSession();
        return;
      }
      if (get().userId !== session.userId) {
        resetLists();
        set({ userId: null, email: null, profile: null, progress: null });
      }
      const data = await readProfile(session.userId);
      if (version !== sessionVersion) return;
      if (get().userId !== session.userId) resetLists();
      set({ ...data, userId: session.userId, email: session.email });
    } catch (err: any) {
      if (version === sessionVersion) set({ error: err.message ?? 'Could not restore session. Please retry.' });
    } finally {
      if (version === sessionVersion) set({ isInitialized: true, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    if (get().isLoading) throw new Error('Another account operation is pending.');
    const version = ++sessionVersion;
    set({ isLoading: true, error: null });
    try {
      const result = await authService.signIn({ email, password });
      if (version !== sessionVersion) throw new Error('Session changed. Please try again.');
      const data = await readProfile(result.userId);
      if (version !== sessionVersion) throw new Error('Session changed. Please try again.');
      resetLists();
      set({ ...data, userId: result.userId, email: result.email, isInitialized: true });
    } catch (err: any) {
      if (version === sessionVersion) set({ error: err.message ?? 'Login failed' });
      throw err;
    } finally {
      if (version === sessionVersion) set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    if (get().isLoading) throw new Error('Another account operation is pending.');
    const version = ++sessionVersion;
    set({ isLoading: true, error: null });
    try {
      const result = await authService.signUp({ email, password, fullName });
      if (version !== sessionVersion) throw new Error('Session changed. Please try again.');
      if (result.requiresEmailConfirmation) {
        get().clearSession();
        return 'confirmationRequired';
      }
      // The database trigger owns profile/progress creation; do not insert twice.
      const data = await readProfile(result.userId);
      if (version !== sessionVersion) throw new Error('Session changed. Please try again.');
      resetLists();
      set({ ...data, userId: result.userId, email: result.email, isInitialized: true });
      return 'signedIn';
    } catch (err: any) {
      if (version === sessionVersion) set({ error: err.message ?? 'Registration failed' });
      throw err;
    } finally {
      if (version === sessionVersion) set({ isLoading: false });
    }
  },

  signOut: async () => {
    const version = ++sessionVersion;
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      if (version === sessionVersion) get().clearSession();
    } catch (err: any) {
      if (version === sessionVersion) set({ error: err.message ?? 'Logout failed' });
      throw err;
    } finally {
      if (version === sessionVersion) set({ isLoading: false });
    }
  },

  updateProfile: (updates, userId) => {
    const current = get().profile;
    if (current && get().userId === userId) set({ profile: { ...current, ...updates } });
  },
  updateProgress: (progress) => {
    if (get().userId === progress.user_id) set({ progress });
  },
  clearError: () => set({ error: null }),
}));
