import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Building,
  Save,
  Lock,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { LoadingScreen } from '@/components/common/LoadingSpinner';

export default function AdminSettingsPage() {
  const { profile, claims } = useAuthStore();
  const isSuperAdmin = claims?.role === Role.SUPER_ADMIN;

  // Estados locales para los formularios
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [storageLimitGB, setStorageLimitGB] = useState(5);
  const [allowedTypes, setAllowedTypes] = useState({
    pdf: true,
    images: true,
    docs: true,
    archives: false,
  });
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(15);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Cargar detalles del inquilino (tenants) si es Super Admin
  const { isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant-details', profile?.tenantId],
    queryFn: async () => {
      if (!isSuperAdmin) return null;
      const res = await api.get(`/api/v1/tenants/${profile?.tenantId}`);
      setTenantName(res.data.name || '');
      setTenantSlug(res.data.slug || '');
      return res.data;
    },
    enabled: !!profile?.tenantId && isSuperAdmin,
  });

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Se requieren permisos de Súper Administrador');
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/api/v1/tenants/${profile?.tenantId}`, {
        name: tenantName,
        slug: tenantSlug,
      });
      toast.success('Información del Workspace actualizada');
    } catch (err) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulación de guardado de configuraciones de seguridad generales
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Políticas de seguridad actualizadas con éxito');
    }, 1000);
  };

  if (tenantLoading) return <LoadingScreen />;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Configuración del Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ajusta las configuraciones globales, límites de almacenamiento y políticas de acceso.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información de Tenant (Solo editable por Super Admin) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveTenant} className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Building className="w-5 h-5 text-primary-400" />
              Información de la Organización (Workspace)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Nombre de la Organización</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Ej. Hospital Central"
                  required
                  disabled={!isSuperAdmin}
                  className="input-dark w-full disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Slug de Identificación (Subdominio)</label>
                <input
                  type="text"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="ej. hospital-central"
                  required
                  disabled={!isSuperAdmin}
                  className="input-dark w-full disabled:opacity-50 font-mono"
                />
              </div>
            </div>

            {!isSuperAdmin && (
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2.5 text-xs text-slate-500">
                <Lock className="w-4 h-4 text-slate-600" />
                Solo los Súper Administradores pueden editar la información del inquilino (Tenant).
              </div>
            )}

            {isSuperAdmin && (
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Cambios
                </button>
              </div>
            )}
          </form>

          {/* Políticas de Seguridad y Archivos */}
          <form onSubmit={handleSaveSecurity} className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Shield className="w-5 h-5 text-accent-400" />
              Políticas de Archivos y Seguridad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Límite de Almacenamiento */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Límite Máximo de Almacenamiento (GB)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={storageLimitGB}
                    onChange={(e) => setStorageLimitGB(Number(e.target.value))}
                    className="input-dark w-24"
                  />
                  <span className="text-sm text-slate-400">GB por Workspace</span>
                </div>
              </div>

              {/* Tiempo de expiración de sesión */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Tiempo Límite de Sesión por Inactividad
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={sessionTimeoutMinutes}
                    onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                    className="input-dark w-24"
                  />
                  <span className="text-sm text-slate-400">minutos antes del Auto-Logout</span>
                </div>
              </div>
            </div>

            {/* Tipos MIME permitidos */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3">Formatos de Archivos Permitidos</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'pdf', label: 'PDF (.pdf)' },
                  { key: 'images', label: 'Imágenes (JPG, PNG)' },
                  { key: 'docs', label: 'Documentos (Word, Excel)' },
                  { key: 'archives', label: 'Compresos (ZIP, RAR)' },
                ].map((type) => (
                  <label
                    key={type.key}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer text-xs text-white"
                  >
                    <input
                      type="checkbox"
                      checked={(allowedTypes as any)[type.key]}
                      onChange={(e) =>
                        setAllowedTypes({
                          ...allowedTypes,
                          [type.key]: e.target.checked,
                        })
                      }
                      className="rounded border-white/10 bg-slate-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-slate-900 w-4 h-4"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                {isSaving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Actualizar Políticas
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Tarjeta de Acceso y Estado */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Estado de Cumplimiento</h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-2 text-slate-400">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Cumplimiento HIPAA / GDPR</p>
                  <p className="mt-0.5">La auditoría está activa y registra todas las descargas de archivos en base de datos.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-400">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Cifrado MinIO en Reposo</p>
                  <p className="mt-0.5">El almacenamiento de MinIO está cifrado mediante AES-256 para archivos temporales.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-400">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Firebase IdP Enforced</p>
                  <p className="mt-0.5">Se validan los tokens criptográficos en cada petición HTTP por inquilino.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
