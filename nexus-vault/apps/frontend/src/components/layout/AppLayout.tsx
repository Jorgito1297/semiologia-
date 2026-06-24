import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  ChevronRight,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import { Sidebar } from './Sidebar';
import { SessionTimeoutModal } from '@/components/common/SessionTimeoutModal';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuthStore } from '@/store/auth.store';
import type { BreadcrumbItem } from '@/types';

// ---- Breadcrumb helpers ----
function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: 'Inicio', href: '/dashboard' }];
  const parts = pathname.split('/').filter(Boolean);

  const labelMap: Record<string, string> = {
    dashboard: 'Panel Principal',
    files:     'Mis Archivos',
    admin:     'Administración',
    users:     'Usuarios',
    audit:     'Auditoría',
    storage:   'Almacenamiento',
    settings:  'Configuración',
    profile:   'Mi Perfil',
  };

  parts.forEach((part, i) => {
    const href  = '/' + parts.slice(0, i + 1).join('/');
    const label = labelMap[part] ?? part.charAt(0).toUpperCase() + part.slice(1);
    crumbs.push({ label, href: i < parts.length - 1 ? href : undefined });
  });

  return crumbs;
}

// ---- Topbar ----
interface TopbarProps {
  onMobileMenuOpen: () => void;
  breadcrumbs:      BreadcrumbItem[];
}

function Topbar({ onMobileMenuOpen, breadcrumbs }: TopbarProps) {
  const { profile } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
      {/* Mobile menu trigger */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
            {crumb.href && i < breadcrumbs.length - 1 ? (
              <a
                href={crumb.href}
                className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors truncate"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="text-white text-sm font-semibold truncate">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search (decorative on mobile, functional placeholder) */}
        <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300 text-sm transition-colors w-48">
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs">Buscar archivos…</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-4.5 h-4.5" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 ring-2 ring-dark-900" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full ring-2 ring-primary-500/30 cursor-pointer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm cursor-pointer">
              {(profile?.displayName?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">
              {profile?.displayName?.split(' ')[0] ?? 'User'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---- AppLayout ----
export function AppLayout() {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const location = useLocation();

  const { showWarning, countdown, extendSession, forceSignOut } = useSessionTimeout();
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <div className={clsx(
      'flex h-screen overflow-hidden bg-dark-900',
    )}>
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          onMobileMenuOpen={() => setMobileOpen(true)}
          breadcrumbs={breadcrumbs}
        />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Session timeout warning */}
      {showWarning && (
        <SessionTimeoutModal
          countdown={countdown}
          onExtend={extendSession}
          onSignOut={forceSignOut}
        />
      )}
    </div>
  );
}
