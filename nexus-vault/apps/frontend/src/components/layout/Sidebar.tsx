import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  Users,
  ClipboardList,
  HardDrive,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

// ---- Vault Logo ----
function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="relative">
        <div className="absolute -inset-1 rounded-xl bg-primary-500/30 blur-md" />
        <div className="relative w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="overflow-hidden">
        <span className="text-base font-extrabold gradient-text tracking-tight whitespace-nowrap">
          NEXUS VAULT
        </span>
        <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase whitespace-nowrap">
          Plataforma Enterprise
        </p>
      </div>
    </div>
  );
}

// ---- Role badge colors ----
const roleBadgeClass: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  [Role.ADMIN]:       'bg-red-500/15    text-red-300    border-red-500/20',
  [Role.SUPERVISOR]:  'bg-orange-500/15 text-orange-300 border-orange-500/20',
  [Role.INSTRUCTOR]:  'bg-blue-500/15   text-blue-300   border-blue-500/20',
  [Role.USER]:        'bg-slate-500/15  text-slate-300  border-slate-500/20',
  [Role.STUDENT]:     'bg-success-500/15 text-success-400 border-success-500/20',
};

const roleLabel: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Súper Admin',
  [Role.ADMIN]:       'Admin',
  [Role.SUPERVISOR]:  'Supervisor',
  [Role.INSTRUCTOR]:  'Instructor',
  [Role.USER]:        'Usuario',
  [Role.STUDENT]:     'Estudiante',
};

// ---- Nav Items ----
interface NavItemDef {
  label:   string;
  href:    string;
  icon:    React.ComponentType<{ className?: string }>;
  roles?:  Role[];
}

const mainNav: NavItemDef[] = [
  { label: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mis Archivos',  href: '/files',     icon: Files },
  { label: 'Mi Perfil',   href: '/profile',   icon: UserIcon },
];

const adminNav: NavItemDef[] = [
  { label: 'Panel Admin',     href: '/admin',          icon: Shield,         roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { label: 'Usuarios',           href: '/admin/users',    icon: Users,          roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { label: 'Auditoría',       href: '/admin/audit',    icon: ClipboardList,  roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { label: 'Almacenamiento',         href: '/admin/storage',  icon: HardDrive,      roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { label: 'Configuración',        href: '/admin/settings', icon: Settings,       roles: [Role.SUPER_ADMIN] },
];

// ---- Sidebar Component ----
interface SidebarProps {
  collapsed:     boolean;
  onCollapse:    (v: boolean) => void;
  mobileOpen:    boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, claims, signOut } = useAuthStore();
  const location = useLocation();

  const isAdmin = claims && [Role.SUPER_ADMIN, Role.ADMIN].includes(claims.role);

  function NavItem({ item }: { item: NavItemDef }) {
    const isActive = location.pathname === item.href ||
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

    return (
      <NavLink
        to={item.href}
        onClick={onMobileClose}
        className={clsx(
          'nav-item',
          isActive && 'active',
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-primary-400' : 'text-slate-400')} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {isActive && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
        )}
      </NavLink>
    );
  }

  const content = (
    <aside className={clsx(
      'flex flex-col h-full bg-dark-800/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 min-h-[64px]">
        {!collapsed && <SidebarLogo />}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="hidden lg:flex w-6 h-6 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors flex-shrink-0 ml-auto"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
        {/* Main section */}
        {!collapsed && (
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Principal
          </p>
        )}
        {mainNav.map((item) => <NavItem key={item.href} item={item} />)}

        {/* Admin section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Administración
              </p>
            )}
            {!collapsed && <div className="border-t border-white/5 mb-2" />}
            {adminNav
              .filter(item => !item.roles || (claims && item.roles.includes(claims.role)))
              .map((item) => <NavItem key={item.href} item={item} />)
            }
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/5">
        {/* User card */}
        <div className={clsx(
          'flex items-center gap-3 p-2.5 rounded-xl mb-2',
          collapsed ? 'justify-center' : '',
        )}>
          {/* Avatar */}
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-primary-500/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
              {(profile?.displayName?.[0] ?? profile?.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.displayName ?? 'User'}
              </p>
              {claims && (
                <span className={clsx(
                  'badge text-[10px] border mt-0.5',
                  roleBadgeClass[claims.role],
                )}>
                  {roleLabel[claims.role]}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut()}
          className={clsx(
            'nav-item w-full text-danger-400 hover:bg-danger-500/10 hover:text-danger-300',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        {content}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative z-50 w-60 h-full animate-slideDown">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
