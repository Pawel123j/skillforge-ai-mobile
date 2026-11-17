import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { ToastContainer } from '@/components/common/ToastContainer';
import { authService } from '@/services/authService';
import { IS_MOCK_MODE } from '@/lib/supabase';

export default function RootLayout() {
  const { theme, colors, loadTheme } = useThemeStore();
  const { initialize, userId, isInitialized } = useAuthStore();

  useEffect(() => {
    loadTheme();
    initialize();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = authService.onAuthStateChange((nextUserId) => {
      if (timer) clearTimeout(timer);
      if (useAuthStore.getState().sessionChanged(nextUserId)) {
        // Supabase holds its auth lock during callbacks; defer API reads.
        timer = setTimeout(() => { void initialize(); }, 0);
      }
    });
    return () => { subscription.unsubscribe(); if (timer) clearTimeout(timer); };
  }, [initialize, loadTheme]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {IS_MOCK_MODE && <Text style={{ padding: 10, color: colors.text, backgroundColor: colors.surface }}>
        Demo mode — changes reset when you reload. No cloud account is connected.
      </Text>}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={isInitialized && !userId}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        </Stack.Protected>
        <Stack.Protected guard={isInitialized && !!userId}>
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="(tabs)" />
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
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      <ToastContainer />
    </View>
  );
}
