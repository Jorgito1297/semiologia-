import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Router } from '@/router';
import '@/styles/globals.css';

// ---- React Query Client ----
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5, // 5 min
      gcTime:               1000 * 60 * 10, // 10 min
      retry:                1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ---- Root Mount ----
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{ top: 72 }}
        toastOptions={{
          duration: 4000,
          style: {
            background:  '#1a1a2e',
            color:       '#f1f5f9',
            border:      '1px solid rgba(255,255,255,0.10)',
            borderRadius: '12px',
            fontSize:    '14px',
            fontFamily:  'Inter, sans-serif',
            boxShadow:   '0 8px 32px rgba(0,0,0,0.5)',
            padding:     '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1a1a2e' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#1a1a2e' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
