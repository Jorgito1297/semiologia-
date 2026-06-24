import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Files,
  Upload,
  Share2,
  Activity,
  HardDrive,
  Download,
  Trash2,
  Eye,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { FileUploader } from '@/components/files/FileUploader';
import {
  SkeletonStatCards,
  SkeletonTable,
} from '@/components/common/LoadingSpinner';
import type {
  ApiResponse,
  PaginatedResponse,
  DashboardMetrics,
  FileMetadata,
  AuditLog,
  FileCategory,
} from '@/types';

// ---- Helpers ----
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k    = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i    = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const fileCategoryIcon: Record<FileCategory, { icon: string; color: string }> = {
  DOCUMENT:    { icon: '📄', color: 'text-blue-400' },
  IMAGE:       { icon: '🖼️', color: 'text-purple-400' },
  SPREADSHEET: { icon: '📊', color: 'text-success-400' },
  ARCHIVE:     { icon: '🗜️', color: 'text-orange-400' },
  VIDEO:       { icon: '🎬', color: 'text-pink-400' },
  AUDIO:       { icon: '🎵', color: 'text-indigo-400' },
  OTHER:       { icon: '📎', color: 'text-slate-400' },
};

// ---- Stat Card ----
interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ComponentType<{ className?: string }>;
  iconColor: string;
  change?:  string;
  delay?:   number;
}

function StatCard({ label, value, icon: Icon, iconColor, change, delay = 0 }: StatCardProps) {
  return (
    <div
      className="stat-card animate-slideUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className="badge bg-success-500/10 text-success-400 border border-success-500/20 text-xs">
            <TrendingUp className="w-3 h-3" />
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---- File row ----
function FileRow({ file, onDelete }: { file: FileMetadata; onDelete: (id: string) => void }) {
  const cat = fileCategoryIcon[file.category] ?? fileCategoryIcon.OTHER;
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{cat.icon}</span>
          <div>
            <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.originalName}</p>
            <p className="text-xs text-slate-500">{file.mimeType}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-400">{formatBytes(file.size)}</td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {format(new Date(file.createdAt), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {file.downloadCount} dl
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-success-400 hover:bg-success-500/10 transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(file.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---- Activity Feed Item ----
function ActivityItem({ log }: { log: AuditLog }) {
  const actionColor: Record<string, string> = {
    FILE_UPLOAD:   'bg-success-500/10 text-success-400 border-success-500/20',
    FILE_DOWNLOAD: 'bg-blue-500/10    text-blue-400    border-blue-500/20',
    FILE_DELETE:   'bg-danger-500/10  text-danger-400  border-danger-500/20',
    FILE_SHARE:    'bg-purple-500/10  text-purple-400  border-purple-500/20',
    LOGIN:         'bg-primary-500/10 text-primary-400 border-primary-500/20',
    DEFAULT:       'bg-slate-500/10   text-slate-400   border-slate-500/20',
  };

  const colorClass = actionColor[log.action] ?? actionColor.DEFAULT;
  const label = log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <span className={clsx('badge border text-[10px] flex-shrink-0 mt-0.5', colorClass)}>
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 truncate">
          {log.entityType === 'FILE' ? `File: ${log.entityId}` : log.action}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ================================================================
// DASHBOARD PAGE
// ================================================================
export default function DashboardPage() {
  const { profile } = useAuthStore();
  const [uploadOpen, setUploadOpen] = useState(false);

  // ---- Queries ----
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn:  () => api.get<ApiResponse<DashboardMetrics>>('/api/v1/dashboard/metrics').then(r => r.data.data),
  });

  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ['my-files'],
    queryFn:  () => api.get<PaginatedResponse<FileMetadata>>('/api/v1/files?limit=10').then(r => r.data),
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['my-activity'],
    queryFn:  () => api.get<PaginatedResponse<AuditLog>>('/api/v1/audit?limit=10&mine=true').then(r => r.data),
  });

  const metrics = metricsData;
  const files   = filesData?.data ?? [];
  const logs    = auditData?.data  ?? [];

  function handleDeleteFile(id: string) {
    // Would call API + update store
    console.log('Delete file', id);
  }

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            ¡Bienvenido de nuevo,{' '}
            <span className="gradient-text">
              {profile?.displayName?.split(' ')[0] ?? 'usuario'} 👋
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Esto es lo que está pasando hoy en tu bóveda.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="btn-primary"
        >
          <Upload className="w-4 h-4" />
          Subir Archivos
        </button>
      </div>

      {/* ---- Stat Cards ---- */}
      {metricsLoading ? (
        <SkeletonStatCards />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Archivos Totales"
            value={metrics?.totalFiles ?? 0}
            icon={Files}
            iconColor="bg-primary-500/10 text-primary-400"
            change="+12%"
            delay={0}
          />
          <StatCard
            label="Almacenamiento Usado"
            value={formatBytes(metrics?.storageUsed ?? 0)}
            icon={HardDrive}
            iconColor="bg-accent-500/10 text-accent-400"
            delay={100}
          />
          <StatCard
            label="Archivos Compartidos"
            value={metrics?.sharedFiles ?? 0}
            icon={Share2}
            iconColor="bg-blue-500/10 text-blue-400"
            delay={200}
          />
          <StatCard
            label="Actividad Reciente"
            value={metrics?.recentActivity ?? 0}
            icon={Activity}
            iconColor="bg-success-500/10 text-success-400"
            change="Hoy"
            delay={300}
          />
        </div>
      )}

      {/* ---- Storage progress ---- */}
      {metrics && (
        <div className="glass-card p-5 animate-slideUp" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Uso de Almacenamiento</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatBytes(metrics.storageUsed)} de {formatBytes(metrics.storageLimit)} usados
              </p>
            </div>
            <span className="text-sm font-bold text-primary-400">
              {Math.round((metrics.storageUsed / metrics.storageLimit) * 100)}%
            </span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min((metrics.storageUsed / metrics.storageLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ---- Files table + Activity feed ---- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Files Table */}
        <div className="xl:col-span-2 glass-card overflow-hidden animate-slideUp" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="text-base font-bold text-white">Archivos Recientes</h2>
            <a href="/files" className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Ver todos →
            </a>
          </div>

          {filesLoading ? (
            <div className="p-6"><SkeletonTable rows={5} /></div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Files className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-500 font-medium">Aún no hay archivos</p>
              <p className="text-slate-600 text-sm mt-1">Sube tu primer archivo para comenzar</p>
              <button onClick={() => setUploadOpen(true)} className="btn-primary mt-4 text-sm">
                <Upload className="w-4 h-4" /> Subir Archivo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-dark">
                <thead>
                  <tr>
                    <th className="text-left">Nombre</th>
                    <th className="text-left">Tamaño</th>
                    <th className="text-left">Subido</th>
                    <th className="text-left">Descargas</th>
                    <th className="text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <FileRow key={file.id} file={file} onDelete={handleDeleteFile} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="glass-card animate-slideUp" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <div className="px-6 py-5 border-b border-white/5">
            <h2 className="text-base font-bold text-white">Actividad Reciente</h2>
          </div>
          <div className="px-6 py-3 overflow-y-auto max-h-[400px] no-scrollbar">
            {auditLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="skeleton w-20 h-5 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-2 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">Sin actividad de momento</p>
              </div>
            ) : (
              logs.map((log) => <ActivityItem key={log.id} log={log} />)
            )}
          </div>
        </div>
      </div>

      {/* ---- File Uploader Modal ---- */}
      {uploadOpen && (
        <FileUploader onClose={() => setUploadOpen(false)} />
      )}
    </div>
  );
}
