import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

const IDLE_WARN_MS  = 13 * 60 * 1000; // 13 min → show warning
const COUNTDOWN_S   = 120;            // 2-minute countdown

export interface SessionTimeoutState {
  showWarning:       boolean;
  countdown:         number;      // seconds remaining
  extendSession:     () => void;
  forceSignOut:      () => void;
}

/**
 * useSessionTimeout
 *
 * Tracks user activity. After IDLE_WARN_MS of inactivity shows a warning
 * with a COUNTDOWN_S countdown. After IDLE_LIMIT_MS auto signs-out.
 */
export function useSessionTimeout(): SessionTimeoutState {
  const { isAuthenticated, signOut } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown,   setCountdown]   = useState(COUNTDOWN_S);

  const warnTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef  = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (warnTimerRef.current)    clearTimeout(warnTimerRef.current);
    if (signOutTimerRef.current) clearTimeout(signOutTimerRef.current);
    if (countdownRef.current)    clearInterval(countdownRef.current);
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_S);
    countdownRef.current = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const resetTimers = useCallback(() => {
    if (!isAuthenticated) return;
    lastActivityRef.current = Date.now();

    clearAllTimers();
    setShowWarning(false);
    setCountdown(COUNTDOWN_S);

    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();

      // Auto sign-out after another 2 minutes
      signOutTimerRef.current = setTimeout(() => {
        signOut();
      }, COUNTDOWN_S * 1000);
    }, IDLE_WARN_MS);
  }, [isAuthenticated, clearAllTimers, startCountdown, signOut]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  const forceSignOut = useCallback(() => {
    clearAllTimers();
    signOut();
  }, [clearAllTimers, signOut]);

  // Attach activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    const handler = () => {
      const now = Date.now();
      // Throttle: only reset if 10s+ have passed since last activity
      if (now - lastActivityRef.current > 10_000) {
        resetTimers();
      }
    };

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetTimers(); // start on mount

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearAllTimers();
    };
  }, [isAuthenticated, resetTimers, clearAllTimers]);

  // Stop timers when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      setShowWarning(false);
    }
  }, [isAuthenticated, clearAllTimers]);

  return { showWarning, countdown, extendSession, forceSignOut };
}
