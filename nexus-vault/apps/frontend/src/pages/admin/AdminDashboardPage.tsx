import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  HardDrive,
  Files,
  ClipboardList,
  Settings,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import clsx from 'clsx';
import api from '@/lib/axios';
import { SkeletonStatCards, SkeletonTable } from '@/components/common/LoadingSpinner';
import type {
  ApiResponse,
  PaginatedResponse,
  AdminMetrics,
  AuditLog,
  UploadTimeSeriesPoint,
  StorageByUser,
} from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---- Custom Recharts Tooltip ----
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-2xl border border-white/10">
      <p className="text-xs text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Stat Card ----
function AdminStatCard({
  label, value, icon: Icon, colorClass, delay = 0,
}: {
  label: string; value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string; delay?: number;
}) {
  return (
    <div
      className="stat-card animate-slideUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---- Audit log row ----
const auditActionColors: Record<string, string> = {
  LOGIN:           'bg-primary-500/10 text-primary-400  border-primary-500/20',
  LOGOUT:          'bg-slate-500/10   text-slate-400    border-slate-500/20',
  FILE_UPLOAD:     'bg-success-500/10 text-success-400  border-success-500/20',
  FILE_DOWNLOAD:   'bg-blue-500/10    text-blue-400     border-blue-500/20',
  FILE_DELETE:     'bg-danger-500/10  text-danger-400   border-danger-500/20',
  ROLE_CHANGE:     'bg-purple-500/10  text-purple-400   border-purple-500/20',
  USER_DEACTIVATE: 'bg-orange-500/10  text-orange-400   border-orange-500/20',
  UNAUTHORIZED:    'bg-danger-500/10  text-danger-400   border-danger-500/20',
  DEFAULT:         'bg-slate-500/10   text-slate-400    border-slate-500/20',
};

function AuditRow({ log }: { log: AuditLog }) {
  const colorClass = auditActionColors[log.action] ?? auditActionColors.DEFAULT;
  const label = log.action.replace(/_/g, ' ');
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
        {format(new Date(log.createdAt), 'MMM d, HH:mm')}
      </td>
      <td className="px-6 py-3">
        <span className={clsx('badge border text-[10px]', colorClass)}>{label}</span>
      </td>
      <td className="px-6 py-3 text-sm text-slate-300">{log.performerEmail}</td>
      <td className="px-6 py-3 text-xs text-slate-500 font-mono">{log.ipAddress}</td>
      <td className="px-6 py-3 text-xs text-slate-600 truncate max-w-[160px]">
        {log.entityType ? `${log.entityType}: ${log.entityId ?? '-'}` : '-'}
      </td>
    </tr>
  );
}

// ================================================================
// ADMIN DASHBOARD PAGE
// ================================================================
export default function AdminDashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn:  () => api.get<ApiResponse<AdminMetrics>>('/api/v1/admin/metrics').then(r => r.data.data),
  });

  const { data: timeSeriesData, isLoading: chartLoading } = useQuery({
    queryKey: ['upload-timeseries'],
    queryFn:  () => api.get<ApiResponse<UploadTimeSeriesPoint[]>>('/api/v1/admin/stats/timeseries?days=30').then(r => r.data.data),
  });

  const { data: storageByUserData } = useQuery({
    queryKey: ['storage-by-user'],
    queryFn:  () => api.get<ApiResponse<StorageByUser[]>>('/api/v1/admin/stats/storage-by-user?limit=10').then(r => r.data.data),
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-recent-audit'],
    queryFn:  () => api.get<PaginatedResponse<AuditLog>>('/api/v1/audit?limit=20').then(r => r.data),
    refetchInterval: 30_000,
  });

  const chartData = timeSeriesData?.map(d => ({
    ...d,
    date: format(new Date(d.date), 'MMM d'),
  })) ?? [];

  const storageBarData = (storageByUserData ?? []).map(u => ({
    name:    u.displayName.split(' ')[0],
    storage: Math.round(u.storageUsed / 1024 / 1024), // MB
  }));

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Panel de Administración</h1>
          <p className="text-slate-500 text-sm mt-1">Métricas y monitoreo globales de la plataforma</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/users"  className="btn-ghost text-sm"><Users className="w-4 h-4" /> Gestionar Usuarios</a>
          <a href="/admin/audit"  className="btn-ghost text-sm"><ClipboardList className="w-4 h-4" /> Auditoría Completa</a>
        </div>
      </div>

      {/* Stat cards */}
      {metricsLoading ? <SkeletonStatCards /> : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <AdminStatCard label="Usuarios Totales"     value={metrics?.totalUsers    ?? 0} icon={Users}     colorClass="bg-primary-500/10 text-primary-400" delay={0}   />
          <AdminStatCard label="Inquilinos Activos"  value={metrics?.activeTenants ?? 0} icon={Building2} colorClass="bg-accent-500/10  text-accent-400"  delay={100} />
          <AdminStatCard label="Almacenamiento Total"   value={formatBytes(metrics?.totalStorage ?? 0)} icon={HardDrive} colorClass="bg-orange-500/10 text-orange-400" delay={200} />
          <AdminStatCard label="Archivos Totales"     value={metrics?.totalFiles    ?? 0} icon={Files}     colorClass="bg-success-500/10 text-success-400" delay={300} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Line Chart — Uploads over 30 days */}
        <div className="xl:col-span-3 glass-card p-6 animate-slideUp" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="mb-5">
            <h2 className="text-base font-bold text-white">Actividad de Carga</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cargas y descargas en los últimos 30 días</p>
          </div>
          {chartLoading ? (
            <div className="h-52 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="uploads"   stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                <Line type="monotone" dataKey="downloads" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart — Storage by user */}
        <div className="xl:col-span-2 glass-card p-6 animate-slideUp" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <div className="mb-5">
            <h2 className="text-base font-bold text-white">Almacenamiento por Usuario</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top 10 usuarios (MB)</p>
          </div>
          {storageBarData.length === 0 ? (
            <div className="h-52 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={storageBarData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="storage" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slideUp" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
        {[
          { label: 'Gestionar Usuarios',   icon: Users,        href: '/admin/users',   color: 'border-primary-500/20 hover:border-primary-500/40 hover:bg-primary-500/5' },
          { label: 'Registro de Auditoría', icon: ClipboardList, href: '/admin/audit',  color: 'border-blue-500/20    hover:border-blue-500/40    hover:bg-blue-500/5' },
          { label: 'Reporte Disco',       icon: HardDrive,     href: '/admin/storage',color: 'border-orange-500/20  hover:border-orange-500/40  hover:bg-orange-500/5' },
          { label: 'Configuración',       icon: Settings,      href: '/admin/settings',color:'border-slate-500/20   hover:border-slate-500/40   hover:bg-slate-500/5' },
        ].map((action) => (
          <a
            key={action.href}
            href={action.href}
            className={clsx(
              'glass-card p-4 flex flex-col items-center gap-3 text-center transition-all duration-200 border',
              action.color,
            )}
          >
            <action.icon className="w-6 h-6 text-slate-300" />
            <span className="text-sm font-medium text-slate-300">{action.label}</span>
          </a>
        ))}
      </div>

      {/* Recent Audit Log */}
      <div className="glass-card overflow-hidden animate-slideUp" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-base font-bold text-white">Eventos de Auditoría Recientes</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
            <span className="text-xs text-slate-500">En vivo · auto-actualizado cada 30s</span>
          </div>
        </div>
        {auditLoading ? (
          <div className="p-6"><SkeletonTable rows={8} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-dark">
              <thead>
                <tr>
                  <th className="text-left">Fecha y Hora</th>
                  <th className="text-left">Acción</th>
                  <th className="text-left">Realizado Por</th>
                  <th className="text-left">Dirección IP</th>
                  <th className="text-left">Entidad</th>
                </tr>
              </thead>
              <tbody>
                {(auditData?.data ?? []).map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
