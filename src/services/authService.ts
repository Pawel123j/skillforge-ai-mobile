import { supabase, IS_MOCK_MODE } from '@/lib/supabase';
import { MOCK_USER_ID, MOCK_PROFILE } from '@/lib/mockData';
import { Profile } from '@/types';

export interface AuthCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResult {
  userId: string;
  email: string;
}

export const authService = {
  async signUp({ email, password, fullName }: AuthCredentials): Promise<AuthResult> {
    if (IS_MOCK_MODE) {
      return { userId: MOCK_USER_ID, email };
    }

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName ?? '' } },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');

    return { userId: data.user.id, email: data.user.email! };
  },

  async signIn({ email, password }: AuthCredentials): Promise<AuthResult> {
    if (IS_MOCK_MODE) {
      return { userId: MOCK_USER_ID, email };
    }

    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    return { userId: data.user.id, email: data.user.email! };
  },

  async signOut(): Promise<void> {
    if (IS_MOCK_MODE) return;
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    if (IS_MOCK_MODE) {
      return { userId: MOCK_USER_ID, email: 'demo@skillforge.ai' };
    }

    const { data, error } = await supabase!.auth.getSession();
    if (error || !data.session) return null;

    return {
      userId: data.session.user.id,
      email: data.session.user.email!,
    };
  },

  onAuthStateChange(callback: (userId: string | null) => void) {
    if (IS_MOCK_MODE) return { unsubscribe: () => {} };

    const { data } = supabase!.auth.onAuthStateChange((_event, session) => {
      callback(session?.user?.id ?? null);
    });

    return { unsubscribe: () => data.subscription.unsubscribe() };
  },
};
