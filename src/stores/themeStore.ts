import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants';

type Theme = 'light' | 'dark';
type ThemeColors = typeof Colors.light | typeof Colors.dark;

interface ThemeState {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

const THEME_KEY = 'skillforge_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  colors: Colors.dark as ThemeColors,

  toggleTheme: async () => {
    const newTheme: Theme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme, colors: Colors[newTheme] as ThemeColors });
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // AsyncStorage failure is non-critical
    }
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        set({ theme: saved, colors: Colors[saved] as ThemeColors });
      }
    } catch {
      // Default theme is already set
    }
  },
}));
