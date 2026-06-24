import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { clearTokenCache } from '@/lib/axios';
import type { UserProfile, UserClaims } from '@/types';

interface AuthState {
  user:            FirebaseUser | null;
  profile:         UserProfile  | null;
  claims:          UserClaims   | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  // Setters
  setUser:    (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile)      => void;
  setClaims:  (claims: UserClaims)        => void;
  setLoading: (loading: boolean)          => void;
  // Actions
  signOut: () => Promise<void>;
  reset:   () => void;
}

const initialState = {
  user:            null,
  profile:         null,
  claims:          null,
  isAuthenticated: false,
  isLoading:       true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading:       false,
        }),

      setProfile: (profile) =>
        set({ profile }),

      setClaims: (claims) =>
        set({ claims }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      signOut: async () => {
        try {
          await auth.signOut();
        } catch {
          // ignore signOut errors
        } finally {
          clearTokenCache();
          localStorage.removeItem('nexus_mock_token');
          set({ ...initialState, isLoading: false });
        }
      },

      reset: () => {
        localStorage.removeItem('nexus_mock_token');
        set({ ...initialState, isLoading: false });
      },
    }),
    {
      name: 'nexus-vault-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive fields
      partialize: (state) => ({
        profile: state.profile,
        claims:  state.claims,
      }),
    },
  ),
);
