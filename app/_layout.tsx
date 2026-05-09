import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { ToastContainer } from '@/components/common/ToastContainer';

export default function RootLayout() {
  const { theme, colors, loadTheme } = useThemeStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    loadTheme();
    initialize();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="lesson/[id]"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="module/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="quiz/[moduleId]"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
      <ToastContainer />
    </View>
  );
}
