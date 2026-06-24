import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  HardDrive,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/axios';
import type { StorageByUser } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StorageOverview {
  totalUsed: number;   // bytes
  totalLimit: number;  // bytes
  totalFiles: number;
  avgFileSize: number; // bytes
  byUser: StorageByUser[];
  topFiles: TopFile[];
}

interface TopFile {
  id: string;
  originalName: string;
  uploaderName: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function usagePercent(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'violet',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: 'violet' | 'emerald' | 'sky' | 'amber';
}) {
  const accentMap = {
    violet: 'text-violet-400 bg-violet-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4 items-start">
      <div className={`p-2.5 rounded-xl ${accentMap[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-white text-xl font-bold truncate">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-24" />
          <div className="h-6 bg-white/10 rounded w-32" />
        </div>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-gray-400 text-xs mb-1 truncate max-w-[160px]">{label}</p>
      <p className="text-violet-300 text-sm font-semibold">
        {formatBytes(payload[0].value)}
      </p>
    </div>
  );
}

type SortKey = 'size' | 'originalName' | 'createdAt';

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminStoragePage() {
  const [sortKey, setSortKey] = useState<SortKey>('size');
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'storage'],
    queryFn: async () => {
      const res = await api.get<{ data: StorageOverview }>('/v1/admin/storage');
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // Sort top files
  const sortedFiles = useMemo(() => {
    if (!data?.topFiles) return [];
    return [...data.topFiles].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'size') cmp = a.size - b.size;
      else if (sortKey === 'originalName')
        cmp = a.originalName.localeCompare(b.originalName);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? cmp : -cmp;
    });
  }, [data?.topFiles, sortKey, sortAsc]);

  // Chart data — top 10 users by storage
  const chartData = useMemo(
    () =>
      (data?.byUser ?? [])
        .slice(0, 10)
        .map((u) => ({
          name: u.displayName || u.email.split('@')[0],
          value: u.storageUsed,
        })),
    [data?.byUser],
  );

  const pct = data ? usagePercent(data.totalUsed, data.totalLimit) : 0;
  const isWarning = pct >= 80;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <span className="text-gray-600 ml-1">↕</span>;
    return (
      <span className="text-violet-400 ml-1">{sortAsc ? '↑' : '↓'}</span>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-rose-400">
        <AlertTriangle className="w-5 h-5 mr-2" />
        Error al cargar los datos de almacenamiento. Por favor, actualice la página.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gestión de Almacenamiento</h1>
        <p className="text-gray-400 text-sm mt-1">
          Monitoree el consumo de almacenamiento de disco y la distribución de archivos entre los usuarios.
        </p>
      </div>

      {/* ── Warning banner ── */}
      {isWarning && !isLoading && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">
              Alerta de Almacenamiento — {pct}% usado
            </p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Considere actualizar el plan de cuota o solicitar a los usuarios que eliminen archivos innecesarios.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={HardDrive}
              label="Almacenamiento Usado"
              value={formatBytes(data!.totalUsed)}
              sub={`${pct}% de ${formatBytes(data!.totalLimit)}`}
              accent="violet"
            />
            <StatCard
              icon={TrendingUp}
              label="Disponible"
              value={formatBytes(data!.totalLimit - data!.totalUsed)}
              sub={`${100 - pct}% restante`}
              accent="emerald"
            />
            <StatCard
              icon={FileText}
              label="Archivos Totales"
              value={data!.totalFiles.toLocaleString()}
              accent="sky"
            />
            <StatCard
              icon={Users}
              label="Tamaño Promedio"
              value={formatBytes(data!.avgFileSize)}
              accent="amber"
            />
          </>
        )}
      </div>

      {/* ── Usage progress bar ── */}
      {!isLoading && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm font-medium">
              Uso General del Almacenamiento
            </span>
            <span
              className={`text-sm font-semibold ${
                isWarning ? 'text-amber-400' : 'text-violet-400'
              }`}
            >
              {pct}%
            </span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                pct >= 90
                  ? 'bg-rose-500'
                  : pct >= 80
                  ? 'bg-amber-500'
                  : 'bg-violet-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatBytes(data!.totalUsed)} usado</span>
            <span>{formatBytes(data!.totalLimit)} total</span>
          </div>
        </div>
      )}

      {/* ── Bar chart — storage by user ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-1">
          Almacenamiento por Usuario — Top 10
        </h2>
        <p className="text-gray-500 text-xs mb-5">
          Usuarios clasificados por total de almacenamiento consumido.
        </p>

        {isLoading ? (
          <div className="h-60 animate-pulse bg-white/5 rounded-xl" />
        ) : chartData.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-gray-500 text-sm">
            Sin datos disponibles.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 8, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatBytes(v)}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === 0
                        ? '#8b5cf6'
                        : i === 1
                        ? '#7c3aed'
                        : `rgba(139,92,246,${0.8 - i * 0.06})`
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top files table ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Archivos Más Grandes</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Los archivos individuales más grandes subidos por los usuarios.
          </p>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-white/5 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            No se encontraron archivos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wide">
                  <th
                    className="text-left px-5 py-3 cursor-pointer hover:text-gray-300 select-none"
                    onClick={() => toggleSort('originalName')}
                  >
                    Nombre del Archivo {sortIcon('originalName')}
                  </th>
                  <th className="text-left px-5 py-3">Usuario</th>
                  <th
                    className="text-right px-5 py-3 cursor-pointer hover:text-gray-300 select-none"
                    onClick={() => toggleSort('size')}
                  >
                    Tamaño {sortIcon('size')}
                  </th>
                  <th className="text-left px-5 py-3">Tipo</th>
                  <th
                    className="text-left px-5 py-3 cursor-pointer hover:text-gray-300 select-none"
                    onClick={() => toggleSort('createdAt')}
                  >
                    Subido {sortIcon('createdAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFiles.map((file, i) => (
                  <tr
                    key={file.id}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                      i % 2 === 0 ? '' : 'bg-white/[0.01]'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <span className="text-white font-medium truncate max-w-[220px] block">
                        {file.originalName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {file.uploaderName}
                    </td>
                    <td className="px-5 py-3 text-right text-violet-300 font-mono font-medium">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-gray-500 text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                        {file.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(file.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
