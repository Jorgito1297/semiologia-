import { type FC } from 'react';
import { clsx } from 'clsx';

type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'gray';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  info: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  purple: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-indigo-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-sky-400',
  purple: 'bg-violet-400',
  gray: 'bg-gray-400',
};

/**
 * Badge — compact label pill with optional status dot.
 *
 * @example
 * <Badge variant="success" dot>Active</Badge>
 */
export const Badge: FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'sm',
  dot = false,
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', DOT_CLASSES[variant])}
        />
      )}
      {children}
    </span>
  );
};

// ── RoleBadge helper ──────────────────────────────────────────────────────────

const ROLE_VARIANTS: Record<string, BadgeVariant> = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'danger',
  SUPERVISOR: 'warning',
  INSTRUCTOR: 'info',
  USER: 'gray',
  STUDENT: 'success',
};

/**
 * RoleBadge — pre-configured Badge for user roles.
 *
 * @example
 * <RoleBadge role="ADMIN" />
 */
export const RoleBadge: FC<{ role: string }> = ({ role }) => (
  <Badge variant={ROLE_VARIANTS[role] ?? 'gray'} dot>
    {role.replace('_', ' ')}
  </Badge>
);
