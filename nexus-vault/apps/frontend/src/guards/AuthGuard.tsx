import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { LoadingScreen } from '@/components/common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard — Protects routes that require authentication.
 *
 * - Shows full-screen loading while auth state resolves
 * - Redirects to /auth/login if not authenticated
 * - Renders children when authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
