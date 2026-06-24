import { type FC } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmModal — accessible confirmation dialog with backdrop blur.
 *
 * Renders nothing when `isOpen` is false, so it is safe to always keep it
 * mounted without any portal / DOM overhead.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showDelete}
 *   title="Delete file?"
 *   message="This action cannot be undone."
 *   variant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDelete(false)}
 * />
 */
export const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="relative z-10 w-full max-w-md mx-4 bg-gray-900/95 border border-white/10 rounded-2xl p-6 shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={clsx(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              variant === 'danger' ? 'bg-rose-500/20' : 'bg-amber-500/20',
            )}
          >
            <AlertTriangle
              className={clsx(
                'w-5 h-5',
                variant === 'danger' ? 'text-rose-400' : 'text-amber-400',
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirm-modal-title"
              className="text-white font-semibold text-lg leading-tight"
            >
              {title}
            </h3>
            <p
              id="confirm-modal-desc"
              className="text-gray-400 text-sm mt-1 leading-relaxed"
            >
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 min-w-[100px] justify-center',
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/60'
                : 'bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/60',
            )}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
