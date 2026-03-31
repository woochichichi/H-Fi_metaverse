import { create } from 'zustand';
import type { Profile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: import('@supabase/supabase-js').User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: import('@supabase/supabase-js').User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('프로필 조회 실패:', error.message);
      return;
    }
    set({ profile: data });
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
    set({ user: data.user });
    await get().fetchProfile(data.user.id);
    return { error: null };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      }
    } catch (err) {
      console.error('세션 초기화 실패:', err);
    } finally {
      set({ isLoading: false });
    }

    // 세션 변경 리스너
    supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        set({ user: session.user });
        if (!get().profile || get().profile?.id !== session.user.id) {
          await get().fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null });
      }
    });

    // 탭 복귀 시 세션 자동 갱신
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession();
      }
    });
  },
}));
