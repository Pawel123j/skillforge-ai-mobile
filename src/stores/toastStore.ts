import { create } from 'zustand';
import { ToastConfig, ToastType } from '@/components/common/ToastItem';

interface ToastState {
  toasts: ToastConfig[];
  show: (config: Omit<ToastConfig, 'id'>) => void;
  dismiss: (id: string) => void;
  showXP: (amount: number) => void;
  showAchievement: (title: string, message?: string) => void;
  showStreak: (days: number) => void;
  showSuccess: (title: string, message?: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (config) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set({ toasts: [...get().toasts.slice(-2), { ...config, id }] });
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  showXP: (amount) =>
    get().show({
      type: 'xp',
      title: `+${amount} XP Earned!`,
      message: 'Keep up the great work',
      duration: 2500,
    }),

  showAchievement: (title, message) =>
    get().show({ type: 'achievement', title, message, duration: 3200 }),

  showStreak: (days) =>
    get().show({
      type: 'streak',
      title: `${days}-Day Streak! 🔥`,
      message: 'Your consistency is building real skills',
      duration: 3000,
    }),

  showSuccess: (title, message) =>
    get().show({ type: 'success', title, message, duration: 2200 }),
}));
