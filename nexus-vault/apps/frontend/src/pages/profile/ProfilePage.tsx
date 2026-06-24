import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon,
  Mail,
  Shield,
  HardDrive,
  Building,
  Key,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { RoleBadge } from '@/components/common/Badge';
import type { AuditLog, PaginatedResponse } from '@/types';

// Helper para formatear bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ProfilePage() {
  const { profile } = useAuthStore();
  const [copiedId, setCopiedId] = React.useState(false);

  // Consulta de almacenamiento del usuario
  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ['my-storage-usage'],
    queryFn: () =>
      api
        .get<{ bytesUsed: number; fileCount: number }>('/api/v1/users/me/storage')
        .then((r) => r.data),
  });

  // Consulta de actividades recientes del usuario
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['my-recent-activity'],
    queryFn: () =>
      api
        .get<PaginatedResponse<AuditLog>>('/api/v1/audit?limit=5&mine=true')
        .then((r) => r.data),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('ID copiado al portapapeles');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const maxStorage = 5 * 1024 * 1024 * 1024; // 5 GB por defecto si no hay límite
  const storageUsed = storageData?.bytesUsed ?? 0;
  const storagePercentage = Math.min(Math.round((storageUsed / maxStorage) * 100), 100);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestiona los detalles de tu cuenta y visualiza tus estadísticas de seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tarjeta del Perfil */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
          {/* Fondo difuminado de decoración */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary-500 to-accent-500" />
          
          <div className="relative w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-white/10 overflow-hidden mt-4">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-slate-500" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{profile?.displayName || 'Usuario de Vault'}</h2>
            <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email}
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full pt-4 border-t border-white/5 text-left text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Rol
              </span>
              <RoleBadge role={profile?.role || 'USER'} />
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="w-4 h-4" /> Inquilino ID
              </span>
              <span className="text-white font-mono text-xs max-w-[120px] truncate" title={profile?.tenantId}>
                {profile?.tenantId || '-'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Key className="w-4 h-4" /> Firebase UID
              </span>
              <button
                onClick={() => copyToClipboard(profile?.firebaseUid ?? '')}
                className="text-slate-400 hover:text-white font-mono text-xs flex items-center gap-1 bg-white/[0.03] border border-white/5 hover:border-white/10 px-2 py-0.5 rounded transition-all"
              >
                <span className="max-w-[100px] truncate">{profile?.firebaseUid}</span>
                {copiedId ? <Check className="w-3 h-3 text-success-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Cuota de Almacenamiento y Actividad */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Almacenamiento */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary-400" />
              Uso de Almacenamiento
            </h3>

            {storageLoading ? (
              <div className="h-16 skeleton rounded-xl" />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Has usado <strong className="text-white">{formatBytes(storageUsed)}</strong> de{' '}
                    <strong className="text-white">{formatBytes(maxStorage)}</strong> (Límite estándar)
                  </span>
                  <span className="font-semibold text-primary-400">{storagePercentage}%</span>
                </div>

                <div className="progress-bar h-3">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500">
                  Total de archivos cargados: <strong>{storageData?.fileCount ?? 0}</strong> archivos.
                </p>
              </div>
            )}
          </div>

          {/* Tarjeta de Actividades Recientes */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-400" />
              Mi Actividad Reciente
            </h3>

            {auditLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 skeleton rounded-lg" />
                ))}
              </div>
            ) : !auditData?.data || auditData.data.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No hay registros de actividad recientes.</p>
            ) : (
              <div className="space-y-3">
                {auditData.data.map((log) => {
                  const label = log.action.replace(/_/g, ' ').toLowerCase();
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary-400" />
                        <div>
                          <p className="text-white capitalize">{label}</p>
                          <p className="text-xs text-slate-500">IP: {log.ipAddress}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {format(new Date(log.createdAt), "dd 'de' MMM, HH:mm", { locale: es })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
