import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { AuthGuard } from '@/guards/AuthGuard';
import { RoleGuard, AccessDenied } from '@/guards/RoleGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingScreen } from '@/components/common/LoadingSpinner';
import { Role } from '@/types';
import { useAuth } from '@/hooks/useAuth';

// ---- Lazy-loaded pages ----
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'));
const AuthCallbackPage   = lazy(() => import('@/pages/auth/AuthCallbackPage'));
const DashboardPage      = lazy(() => import('@/pages/dashboard/DashboardPage'));
const FilesPage          = lazy(() => import('@/pages/files/FilesPage'));
const FileDetailPage     = lazy(() => import('@/pages/files/FileDetailPage'));
const ProfilePage        = lazy(() => import('@/pages/profile/ProfilePage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage     = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminAuditPage     = lazy(() => import('@/pages/admin/AdminAuditPage'));
const AdminStoragePage   = lazy(() => import('@/pages/admin/AdminStoragePage'));
const AdminSettingsPage  = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'));

// ---- Suspense wrapper ----
function SuspensePage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

// ---- Admin layout wrapper with role guard ----
function AdminGuardLayout() {
  return (
    <RoleGuard
      requiredRoles={[Role.SUPER_ADMIN, Role.ADMIN]}
      fallback={<AccessDenied />}
    >
      <Outlet />
    </RoleGuard>
  );
}

// ---- Router definition ----
const router = createBrowserRouter([
  // Public routes
  {
    path: '/auth/login',
    element: (
      <SuspensePage>
        <LoginPage />
      </SuspensePage>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <SuspensePage>
        <AuthCallbackPage />
      </SuspensePage>
    ),
  },

  // Protected routes (AppLayout wraps all)
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      // Redirect root → dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      {
        path: 'dashboard',
        element: (
          <SuspensePage>
            <DashboardPage />
          </SuspensePage>
        ),
      },
      {
        path: 'files',
        element: (
          <SuspensePage>
            <FilesPage />
          </SuspensePage>
        ),
      },
      {
        path: 'files/:id',
        element: (
          <SuspensePage>
            <FileDetailPage />
          </SuspensePage>
        ),
      },
      {
        path: 'profile',
        element: (
          <SuspensePage>
            <ProfilePage />
          </SuspensePage>
        ),
      },

      // Admin sub-routes
      {
        path: 'admin',
        element: <AdminGuardLayout />,
        children: [
          {
            index: true,
            element: (
              <SuspensePage>
                <AdminDashboardPage />
              </SuspensePage>
            ),
          },
          {
            path: 'users',
            element: (
              <SuspensePage>
                <AdminUsersPage />
              </SuspensePage>
            ),
          },
          {
            path: 'audit',
            element: (
              <SuspensePage>
                <AdminAuditPage />
              </SuspensePage>
            ),
          },
          {
            path: 'storage',
            element: (
              <SuspensePage>
                <AdminStoragePage />
              </SuspensePage>
            ),
          },
          {
            path: 'settings',
            element: (
              <SuspensePage>
                <RoleGuard requiredRoles={[Role.SUPER_ADMIN]} fallback={<AccessDenied />}>
                  <AdminSettingsPage />
                </RoleGuard>
              </SuspensePage>
            ),
          },
        ],
      },
    ],
  },

  // 404
  {
    path: '*',
    element: (
      <SuspensePage>
        <NotFoundPage />
      </SuspensePage>
    ),
  },
]);

export function Router() {
  useAuth();
  return <RouterProvider router={router} />;
}
