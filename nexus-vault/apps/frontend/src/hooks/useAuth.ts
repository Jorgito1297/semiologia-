import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import type { UserProfile, UserClaims } from '@/types';

/**
 * useAuth — Primary authentication hook.
 *
 * - Subscribes to Firebase onAuthStateChanged
 * - On login: fetches backend profile + claims
 * - Provides signOut helper
 * - Manages loading state
 */
export function useAuth() {
  const {
    user, profile, claims, isAuthenticated, isLoading,
    setUser, setProfile, setClaims, setLoading, signOut,
  } = useAuthStore();

  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double-subscription in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setUser(firebaseUser);

        // Get ID token and verify with backend
        const idToken = await firebaseUser.getIdToken();

        const verifyRes = await api.post<{ user: UserProfile; claims: UserClaims }>('/api/v1/auth/verify', { idToken });

        setProfile(verifyRes.data.user);
        setClaims(verifyRes.data.claims);
      } catch (err) {
        console.error('[useAuth] Backend verification failed:', err);
        toast.error('Failed to verify session with server.');
        // Still set the user so the app doesn't loop
        setUser(firebaseUser);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      initialized.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    profile,
    claims,
    isAuthenticated,
    isLoading,
    signOut,
  };
}
