import React from 'react';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/types';

interface RoleGuardProps {
  requiredRoles:  Role[];
  children:       React.ReactNode;
  fallback?:      React.ReactNode;
}

/**
 * RoleGuard — Inline role-based visibility guard.
 *
 * Usage:
 *   <RoleGuard requiredRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
 *     <AdminButton />
 *   </RoleGuard>
 *
 * - If the user's role is in requiredRoles → render children
 * - Otherwise → render fallback (default: null)
 */
export function RoleGuard({ requiredRoles, children, fallback = null }: RoleGuardProps) {
  const { claims } = useAuthStore();

  if (!claims) return null;
  if (!requiredRoles.includes(claims.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * AccessDenied — Standalone access denied page content.
 */
export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fadeIn">
      <div className="glass-card p-10 text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-danger-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          You don&apos;t have the required permissions to view this page.
          Contact your administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}
