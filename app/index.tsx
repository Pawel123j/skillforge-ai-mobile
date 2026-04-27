import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LoadingState } from '@/components/common/LoadingState';

// Route guard: redirect based on auth state and onboarding completion
export default function Index() {
  const { userId, profile, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!userId) {
      router.replace('/auth/login');
    } else if (!profile?.onboarding_completed) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [isInitialized, userId, profile]);

  return <LoadingState message="Starting SkillForge AI..." fullScreen />;
}
