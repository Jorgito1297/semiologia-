import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { LoadingScreen } from '@/components/common/LoadingSpinner';

/**
 * AuthCallbackPage — Handles OAuth redirect callback.
 * Firebase handles the redirect token extraction automatically.
 * We just show a loading screen while auth state resolves.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else if (!isLoading && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <LoadingScreen />;
}
