import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight,
  Shield, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { SkeletonTable } from '@/components/common/LoadingSpinner';
import { RoleGuard } from '@/guards/RoleGuard';
import { Role, AuditCategory, type AuditLog, type PaginatedResponse } from '@/types';

// ---- Action badge colors ----
const actionBadgeColor: Record<string, string> = {
  LOGIN:           'bg-primary-500/10 text-primary-300  border-primary-500/20',
  LOGOUT:          'bg-slate-500/10   text-slate-400    border-slate-500/20',
  LOGIN_FAILED:    'bg-danger-500/10  text-danger-400   border-danger-500/20',
  TOKEN_REFRESH:   'bg-primary-500/10 text-primary-300  border-primary-500/20',
  FILE_UPLOAD:     'bg-success-500/10 text-success-400  border-success-500/20',
  FILE_DOWNLOAD:   'bg-blue-500/10    text-blue-400     border-blue-500/20',
  FILE_DELETE:     'bg-danger-500/10  text-danger-400   border-danger-500/20',
  FILE_SHARE:      'bg-purple-500/10  text-purple-400   border-purple-500/20',
  FILE_VIEW:       'bg-indigo-500/10  text-indigo-400   border-indigo-500/20',
  FILE_RENAME:     'bg-cyan-500/10    text-cyan-400     border-cyan-500/20',
  ROLE_CHANGE:     'bg-purple-500/10  text-purple-400   border-purple-500/20',
  USER_DEACTIVATE: 'bg-orange-500/10  text-orange-400   border-orange-500/20',
  USER_ACTIVATE:   'bg-success-500/10 text-success-400  border-success-500/20',
  SETTINGS_CHANGE: 'bg-yellow-500/10  text-yellow-400   border-yellow-500/20',
  UNAUTHORIZED:    'bg-danger-500/10  text-danger-400   border-danger-500/20',
  FORBIDDEN:       'bg-danger-500/10  text-danger-400   border-danger-500/20',
  RATE_LIMITED:    'bg-orange-500/10  text-orange-400   border-orange-500/20',
  DEFAULT:         'bg-slate-500/10   text-slate-400    border-slate-500/20',
};

const categoryColors: Record<AuditCategory, string> = {
  AUTH:  'bg-primary-500/10 text-primary-300 border-primary-500/20',
  FILE:  'bg-success-500/10 text-success-400 border-success-500/20',
  ADMIN: 'bg-purple-500/10  text-purple-400  border-purple-500/20',
  ERROR: 'bg-danger-500/10  text-danger-400  border-danger-500/20',
};

// ---- Expandable row ----
function AuditTableRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = actionBadgeColor[log.action] ?? actionBadgeColor.DEFAULT;
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <>
      <tr
        className={clsx(
          'border-b border-white/5 transition-colors cursor-pointer',
          expanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]',
        )}
        onClick={() => hasMetadata && setExpanded((v) => !v)}
      >
        <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap font-mono">
          {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
        </td>
        <td className="px-5 py-3.5">
          <span className={clsx('badge border text-[10px]', colorClass)}>
            {log.action.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className={clsx('badge border text-[10px]', categoryColors[log.category])}>
            {log.category}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <p className="text-xs text-slate-300 font-medium">{log.performerName}</p>
          <p className="text-[10px] text-slate-500">{log.performerEmail}</p>
        </td>
        <td className="px-5 py-3.5 text-xs text-slate-500">
          {log.targetUser ?? '—'}
        </td>
        <td className="px-5 py-3.5 text-[10px] text-slate-500 font-mono">{log.ipAddress}</td>
        <td className="px-5 py-3.5 text-xs text-slate-500">
          {log.entityType ? `${log.entityType}` : '—'}
        </td>
        <td className="px-5 py-3.5">
          {hasMetadata && (
            <div className="text-slate-500 hover:text-slate-300 transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          )}
        </td>
      </tr>

      {/* Expanded metadata row */}
      {expanded && hasMetadata && (
        <tr className="bg-dark-800/60">
          <td colSpan={8} className="px-5 py-4">
            <div className="rounded-xl overflow-hidden border border-white/10">
              <div className="px-3 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Metadata
                </span>
              </div>
              <pre className="p-4 text-[11px] text-slate-300 font-mono overflow-x-auto leading-relaxed">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ================================================================
// ADMIN AUDIT PAGE
// ================================================================
export default function AdminAuditPage() {
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState<AuditCategory | ''>('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [page,       setPage]       = useState(1);
  const limit = 25;

  const params = new URLSearchParams({
    page:     String(page),
    limit:    String(limit),
    ...(search   && { search }),
    ...(category && { category }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo }),
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-log', search, category, dateFrom, dateTo, page],
    queryFn:  () => api.get<PaginatedResponse<AuditLog>>(`/api/v1/audit?${params}`).then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const logs       = data?.data       ?? [];
  const pagination = data?.pagination;

  // ---- CSV export ----
  function exportCSV() {
    const headers = ['Fecha y Hora', 'Acción', 'Categoría', 'RealizadoPor', 'Email', 'IP', 'TipoEntidad', 'IdEntidad'];
    const rows = logs.map(l => [
      l.createdAt, l.action, l.category, l.performerName, l.performerEmail,
      l.ipAddress, l.entityType ?? '', l.entityId ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `registro-auditoria-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Registro de auditoría exportado');
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Registro de Auditoría</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
            <p className="text-slate-500 text-sm">Auto-actualizado cada 30s · {pagination?.total ?? 0} eventos en total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost px-3 py-2 text-xs"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Actualizar
          </button>
          <RoleGuard requiredRoles={[Role.SUPER_ADMIN]}>
            <button onClick={exportCSV} className="btn-primary text-sm">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por usuario, correo, IP…"
            className="input-dark pl-9 w-full"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value as AuditCategory | ''); setPage(1); }}
            className="input-dark pl-9 pr-4 appearance-none min-w-[140px]"
          >
            <option value="">Todas las Categorías</option>
            {Object.values(AuditCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Date range */}
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="input-dark"
          title="Desde fecha"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="input-dark"
          title="Hasta fecha"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={12} />
      ) : logs.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/30 border border-white/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No se encontraron eventos de auditoría</p>
          <p className="text-slate-600 text-sm mt-1">Intente cambiar los filtros</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-dark min-w-[900px]">
              <thead>
                <tr>
                  <th className="text-left">Fecha y Hora</th>
                  <th className="text-left">Acción</th>
                  <th className="text-left">Categoría</th>
                  <th className="text-left">Realizado Por</th>
                  <th className="text-left">Destino</th>
                  <th className="text-left">IP</th>
                  <th className="text-left">Entidad</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {logs.map(log => <AuditTableRow key={log.id} log={log} />)}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-xs text-slate-500">
                Página {page} de {pagination.pages} · {pagination.total} eventos
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
    </div>
  );
}

