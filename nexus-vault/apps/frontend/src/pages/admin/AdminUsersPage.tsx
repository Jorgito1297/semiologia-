import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Shield, Edit, UserX, UserCheck, ClipboardList,
  X, Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { SkeletonTable } from '@/components/common/LoadingSpinner';
import { Spinner } from '@/components/common/LoadingSpinner';
import type { PaginatedResponse, UserProfile, Role } from '@/types';
import { Role as RoleEnum } from '@/types';

// ---- Role badge ----
const roleBadgeStyle: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  ADMIN:       'bg-red-500/15    text-red-300    border-red-500/25',
  SUPERVISOR:  'bg-orange-500/15 text-orange-300 border-orange-500/25',
  INSTRUCTOR:  'bg-blue-500/15   text-blue-300   border-blue-500/25',
  USER:        'bg-slate-500/15  text-slate-300  border-slate-500/25',
  STUDENT:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

const ALL_ROLES = Object.values(RoleEnum);

// ---- Edit Role Modal ----
function EditRoleModal({
  user,
  onClose,
  onSave,
  saving,
}: {
  user: UserProfile;
  onClose: () => void;
  onSave: (role: Role) => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<Role>(user.role);

  return (
    <div className="modal-overlay animate-fadeIn">
      <div className="glass-strong rounded-3xl p-7 w-full max-w-sm shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Cambiar Rol</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
              {user.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{user.displayName}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Role selector */}
        <div className="space-y-2 mb-6">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelected(role)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-sm font-medium',
                selected === role
                  ? 'border-primary-500/40 bg-primary-500/10 text-primary-300'
                  : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:text-white',
              )}
            >
              <span className={clsx('badge border text-[10px]', roleBadgeStyle[role])}>{role.replace('_', ' ')}</span>
              {selected === role && <Check className="w-4 h-4 text-primary-400" />}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={() => onSave(selected)}
            disabled={saving || selected === user.role}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" className="text-white" /> : <><Check className="w-4 h-4" /> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Confirm Modal ----
function ConfirmModal({
  title, message, confirmLabel, danger,
  onConfirm, onClose, loading,
}: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void; onClose: () => void; loading?: boolean;
}) {
  return (
    <div className="modal-overlay animate-fadeIn">
      <div className="glass-strong rounded-3xl p-7 w-full max-w-sm shadow-2xl animate-slideUp text-center">
        <div className={clsx(
          'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4',
          danger ? 'bg-danger-500/15 border border-danger-500/20' : 'bg-primary-500/15 border border-primary-500/20',
        )}>
          <Shield className={clsx('w-7 h-7', danger ? 'text-danger-400' : 'text-primary-400')} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx('flex-1 disabled:opacity-50', danger ? 'btn-danger' : 'btn-primary')}
          >
            {loading ? <Spinner size="sm" className="text-white" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ADMIN USERS PAGE
// ================================================================
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState<Role | ''>('');
  const [page,         setPage]         = useState(1);
  const [editUser,     setEditUser]     = useState<UserProfile | null>(null);
  const [confirmUser,  setConfirmUser]  = useState<{ user: UserProfile; action: 'activate' | 'deactivate' } | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn:  () => api.get<PaginatedResponse<UserProfile>>(
      `/api/v1/admin/users?search=${encodeURIComponent(search)}&role=${roleFilter}&page=${page}&limit=${limit}`
    ).then(r => r.data),
    staleTime: 30_000,
  });

  const roleChangeMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.patch(`/api/v1/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast.success('Rol actualizado con éxito');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
    },
    onError: () => toast.error('Error al actualizar el rol'),
  });

  const statusMut = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      api.patch(`/api/v1/admin/users/${userId}/status`, { isActive: active }),
    onSuccess: (_, vars) => {
      toast.success(vars.active ? 'Usuario activado' : 'Usuario desactivado');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmUser(null);
    },
    onError: () => toast.error('Error al actualizar el estado'),
  });

  const users      = data?.data        ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Gestión de Usuarios</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pagination?.total ?? 0} usuarios en total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, correo…"
            className="input-dark pl-9 w-full"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as Role | ''); setPage(1); }}
            className="input-dark pl-9 pr-4 appearance-none min-w-[150px]"
          >
            <option value="">Todos los Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-dark">
              <thead>
                <tr>
                  <th className="text-left">Usuario</th>
                  <th className="text-left">Rol</th>
                  <th className="text-left">Inquilino</th>
                  <th className="text-left">Último Acceso</th>
                  <th className="text-left">Estado</th>
                  <th className="text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs">
                            {user.displayName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{user.displayName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('badge border text-[10px]', roleBadgeStyle[user.role])}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">{user.tenantId}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {user.lastLoginAt
                        ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true, locale: es })
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'badge border text-[10px]',
                        user.isActive
                          ? 'bg-success-500/10 text-success-400 border-success-500/20'
                          : 'bg-danger-500/10  text-danger-400  border-danger-500/20',
                      )}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                          title="Editar Rol"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmUser({ user, action: user.isActive ? 'deactivate' : 'activate' })}
                          className={clsx(
                            'p-1.5 rounded-lg transition-colors',
                            user.isActive
                              ? 'text-slate-400 hover:text-danger-400 hover:bg-danger-500/10'
                              : 'text-slate-400 hover:text-success-400 hover:bg-success-500/10',
                          )}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`/admin/audit?userId=${user.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Ver Auditoría"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-xs text-slate-500">
                Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1.5 text-xs text-slate-400 bg-white/5 rounded-lg border border-white/10">
                  {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={!pagination.hasNext}
                  className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Role Modal */}
      {editUser && (
        <EditRoleModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(role) => roleChangeMut.mutate({ userId: editUser.id, role })}
          saving={roleChangeMut.isPending}
        />
      )}

      {/* Confirm Modal */}
      {confirmUser && (
        <ConfirmModal
          title={confirmUser.action === 'deactivate' ? 'Desactivar Usuario' : 'Activar Usuario'}
          message={
            confirmUser.action === 'deactivate'
              ? `¿Está seguro de que desea desactivar a ${confirmUser.user.displayName}? Perderá el acceso de inmediato.`
              : `¿Reactivar la cuenta del usuario ${confirmUser.user.displayName}?`
          }
          confirmLabel={confirmUser.action === 'deactivate' ? 'Desactivar' : 'Activar'}
          danger={confirmUser.action === 'deactivate'}
          onConfirm={() => statusMut.mutate({ userId: confirmUser.user.id, active: confirmUser.action === 'activate' })}
          onClose={() => setConfirmUser(null)}
          loading={statusMut.isPending}
        />
      )}
    </div>
  );
}
