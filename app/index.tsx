import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

// Route guard: redirect based on auth state and onboarding completion
export default function Index() {
  const { userId, profile, isInitialized, error, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || error) return;

    if (!userId) {
      router.replace('/auth/login');
    } else if (!profile?.onboarding_completed) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [isInitialized, userId, profile, error, router]);

  if (error) return <ErrorState message={error} onRetry={initialize} />;

  return <LoadingState message="Starting SkillForge AI..." fullScreen />;
}
