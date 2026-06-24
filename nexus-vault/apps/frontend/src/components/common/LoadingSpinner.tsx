import { memo } from 'react';

// ============================================================
// NEXUS VAULT — Loading Components
// ============================================================

// ---- Vault Logo SVG ----
function VaultIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="vault-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Vault body */}
      <rect x="4"  y="8"  width="40" height="32" rx="4" stroke="url(#vault-grad)" strokeWidth="2.5" fill="rgba(99,102,241,0.1)" />
      {/* Vault door circle */}
      <circle cx="24" cy="24" r="9" stroke="url(#vault-grad)" strokeWidth="2.5" />
      {/* Handle */}
      <circle cx="24" cy="24" r="3" fill="url(#vault-grad)" />
      {/* Dial marks */}
      <line x1="24" y1="12" x2="24" y2="15" stroke="url(#vault-grad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="33" x2="24" y2="36" stroke="url(#vault-grad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="24" x2="15" y2="24" stroke="url(#vault-grad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="24" x2="36" y2="24" stroke="url(#vault-grad)" strokeWidth="2" strokeLinecap="round" />
      {/* Hinge bolts */}
      <circle cx="8"  cy="16" r="2" fill="url(#vault-grad)" opacity="0.6" />
      <circle cx="8"  cy="32" r="2" fill="url(#vault-grad)" opacity="0.6" />
      <circle cx="40" cy="16" r="2" fill="url(#vault-grad)" opacity="0.6" />
      <circle cx="40" cy="32" r="2" fill="url(#vault-grad)" opacity="0.6" />
    </svg>
  );
}

// ---- Inline Spinner (for buttons, small contexts) ----
export function Spinner({ size = 'sm', className = '' }: { size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  };

  return (
    <div
      className={`${sizeMap[size]} border-current border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// ---- Full-Screen Loading Screen ----
export const LoadingScreen = memo(function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-900">
      {/* Animated orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="orb w-96 h-96 bg-primary-600/30"
          style={{ top: '10%', left: '20%', animationDelay: '0s' }}
        />
        <div
          className="orb w-64 h-64 bg-accent-600/20"
          style={{ bottom: '20%', right: '15%', animationDelay: '-3s', animationDuration: '10s' }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="relative animate-bounce-soft">
          <div className="absolute -inset-4 rounded-full bg-primary-500/20 blur-xl animate-pulse" />
          <div className="relative glass-card p-5 rounded-2xl">
            <VaultIcon className="w-12 h-12" />
          </div>
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text tracking-tight">NEXUS VAULT</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Initializing secure session…</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              animation: 'progressPulse 1.4s ease-in-out infinite',
              width: '60%',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progressPulse {
          0%   { width: 20%; opacity: 0.7; }
          50%  { width: 80%; opacity: 1;   }
          100% { width: 20%; opacity: 0.7; }
        }
      `}</style>
    </div>
  );
});

// ---- Skeleton Components ----

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 flex flex-col gap-2">
          <SkeletonLine className="w-3/4" />
          <SkeletonLine className="w-1/2" />
        </div>
      </div>
      <SkeletonLine className="w-full h-8 rounded-xl" />
      <SkeletonLine className="w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-6 py-4 border-b border-white/5">
        {[40, 24, 16, 12, 8].map((w, i) => (
          <div key={i} className={`skeleton h-3 rounded`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-6 py-4 border-b border-white/5 last:border-0" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center gap-3" style={{ width: '40%' }}>
            <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="skeleton h-3 w-3/4" />
              <div className="skeleton h-2 w-1/2" />
            </div>
          </div>
          <div className="skeleton h-3 rounded" style={{ width: '24%' }} />
          <div className="skeleton h-3 rounded" style={{ width: '16%' }} />
          <div className="skeleton h-3 rounded" style={{ width: '12%' }} />
          <div className="skeleton h-3 rounded" style={{ width: '8%' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
