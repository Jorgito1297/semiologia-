import { useEffect } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface SessionTimeoutModalProps {
  countdown:     number; // seconds
  onExtend:      () => void;
  onSignOut:     () => void;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * SessionTimeoutModal — Shown when user has been idle for ~13 minutes.
 *
 * Displays a countdown timer. User can extend session or sign out.
 * Backdrop is blurred and darkened.
 */
export function SessionTimeoutModal({
  countdown,
  onExtend,
  onSignOut,
}: SessionTimeoutModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isUrgent = countdown <= 30;

  return (
    <div className="modal-overlay animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="timeout-title">
      <div className="glass-strong rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-slideUp text-center">

        {/* Icon */}
        <div className={clsx(
          'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors duration-300',
          isUrgent
            ? 'bg-danger-500/15 border border-danger-500/30'
            : 'bg-primary-500/15 border border-primary-500/20',
        )}>
          <Clock className={clsx(
            'w-8 h-8 transition-colors duration-300',
            isUrgent ? 'text-danger-400' : 'text-primary-400',
          )} />
        </div>

        {/* Title */}
        <h2 id="timeout-title" className="text-xl font-bold text-white mb-2">
          Sesión por Expirar
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Has estado inactivo por un tiempo. Tu sesión se cerrará automáticamente en:
        </p>

        {/* Countdown */}
        <div className={clsx(
          'text-5xl font-extrabold tabular-nums tracking-tight mb-2 transition-colors duration-300',
          isUrgent ? 'text-danger-400' : 'text-primary-300',
        )}>
          {formatCountdown(countdown)}
        </div>
        <p className="text-slate-500 text-xs mb-8">
          {isUrgent ? '⚠ Se requiere atención inmediata' : 'Tiempo restante'}
        </p>

        {/* Progress bar */}
        <div className="progress-bar mb-8">
          <div
            className={clsx('progress-bar-fill', isUrgent && 'bg-gradient-to-r from-danger-600 to-danger-400')}
            style={{ width: `${(countdown / 120) * 100}%`, transition: 'width 1s linear' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSignOut}
            className="btn-ghost flex-1 text-slate-300"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
          <button
            onClick={onExtend}
            className="btn-primary flex-1"
          >
            <RefreshCw className="w-4 h-4" />
            Seguir Conectado
          </button>
        </div>

      </div>
    </div>
  );
}
