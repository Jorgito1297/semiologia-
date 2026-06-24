import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import toast from 'react-hot-toast';
import { auth } from '@/config/firebase';

// ---- Create Axios Instance ----
const api: AxiosInstance = axios.create({
  baseURL:         '/',
  timeout:         30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client':     'nexus-vault-frontend/2.0',
  },
});

// ---- Token cache ----
let cachedToken: string | null    = null;
let tokenExpiry: number           = 0;
let isRefreshing: boolean         = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function getValidToken(): Promise<string | null> {
  const mockToken = typeof window !== 'undefined' ? localStorage.getItem('nexus_mock_token') : null;
  if (mockToken) return mockToken;

  const user = auth.currentUser;
  if (!user) return null;

  const now = Date.now();

  // Return cached token if still valid (5 min buffer)
  if (cachedToken && tokenExpiry - now > 5 * 60 * 1000) {
    return cachedToken;
  }

  // If already refreshing, wait
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    });
  }

  isRefreshing = true;
  try {
    const token    = await user.getIdToken(true);
    const result   = await user.getIdTokenResult();
    cachedToken    = token;
    tokenExpiry    = new Date(result.expirationTime).getTime();
    isRefreshing   = false;
    onTokenRefreshed(token);
    return token;
  } catch {
    isRefreshing = false;
    cachedToken  = null;
    tokenExpiry  = 0;
    return null;
  }
}

// ---- Request Interceptor ----
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getValidToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---- Response Interceptor ----
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const data   = error.response?.data as { message?: string } | undefined;

    switch (status) {
      case 401: {
        // Clear token cache and redirect to login
        cachedToken = null;
        tokenExpiry = 0;
        toast.error('Session expired. Please sign in again.', { id: 'session-expired' });
        // Small delay so toast shows
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1500);
        break;
      }

      case 403: {
        toast.error(
          data?.message ?? 'You do not have permission to perform this action.',
          { id: 'forbidden', duration: 5000 },
        );
        break;
      }

      case 429: {
        toast.error('Too many requests. Please slow down.', {
          id:       'rate-limit',
          duration: 6000,
          icon:     '⏳',
        });
        break;
      }

      case 500:
      case 502:
      case 503: {
        toast.error(
          data?.message ?? 'Server error. Please try again later.',
          { id: `server-${status}`, duration: 5000 },
        );
        break;
      }
    }

    return Promise.reject(error);
  },
);

// ---- Typed API helpers ----
export function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = 0;
}

export default api;
