import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Trash2,
  Share2,
  Calendar,
  Activity,
  ArrowLeft,
  ShieldAlert,
  User,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/axios';
import { useFiles } from '@/hooks/useFiles';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { LoadingScreen } from '@/components/common/LoadingSpinner';
import type { FileMetadata, ApiResponse } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Hook de archivos para descargar/eliminar
  const { download, delete: deleteFile, isDeleting } = useFiles();

  // 1. Obtener detalles del archivo
  const { data: file, isLoading, isError } = useQuery<FileMetadata>({
    queryKey: ['file-detail', id],
    queryFn: () =>
      api.get<ApiResponse<FileMetadata>>(`/api/v1/files/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  // 2. Obtener URL temporal para previsualización (si es imagen)
  const isImage = file?.mimeType.startsWith('image/');
  const { data: previewUrlData } = useQuery<{ url: string }>({
    queryKey: ['file-preview-url', id],
    queryFn: () =>
      api.get<{ url: string }>(`/api/v1/files/${id}/download`).then((r) => r.data),
    enabled: !!id && !!isImage,
  });

  const handleDelete = async () => {
    if (id) {
      await deleteFile(id);
      setDeleteOpen(false);
      navigate('/files', { replace: true });
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (isError || !file) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-danger-400 animate-bounce" />
        <h2 className="text-xl font-bold text-white">Archivo no encontrado</h2>
        <p className="text-slate-500 max-w-sm">
          No tienes permisos para ver este archivo o ha sido eliminado del sistema.
        </p>
        <button onClick={() => navigate('/files')} className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a mis archivos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Botón de retorno */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Título de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-2xl border border-primary-500/20">
            📄
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white truncate max-w-md" title={file.originalName}>
              {file.originalName}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Tipo MIME: <span className="font-mono text-slate-400">{file.mimeType}</span>
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex gap-2">
          <button
            onClick={() => download(file.id, file.originalName)}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 bg-danger-600 hover:bg-danger-500 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border border-danger-500/20 shadow-glow hover:shadow-danger-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información técnica e Historial */}
        <div className="space-y-6">
          {/* Tarjeta de Metadatos */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Información del Archivo</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tamaño</span>
                <span className="text-white font-medium">{formatBytes(file.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Subido el
                </span>
                <span className="text-white font-medium">
                  {format(new Date(file.createdAt), "dd 'de' MMM, yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Activity className="w-4 h-4" /> Descargas
                </span>
                <span className="text-white font-semibold">{file.downloadCount} descargas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="w-4 h-4" /> Propietario
                </span>
                <span className="text-white font-mono text-xs max-w-[120px] truncate" title={file.uploadedBy}>
                  {file.uploadedBy}
                </span>
              </div>
            </div>
          </div>

          {/* Historial de Compartidos */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-400" />
              Historial de Compartidos
            </h3>
            
            {/* Cast file shares to appropriate array */}
            {!(file as any).shares || (file as any).shares.length === 0 ? (
              <p className="text-slate-500 text-xs py-2">Este archivo no se ha compartido con otros usuarios.</p>
            ) : (
              <div className="space-y-3">
                {((file as any).shares as any[]).map((share) => (
                  <div key={share.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-xs">
                    <div>
                      <p className="text-white font-mono truncate max-w-[140px]" title={share.toUserId}>
                        Para: {share.toUserId}
                      </p>
                      {share.message && <p className="text-slate-500 italic mt-0.5">"{share.message}"</p>}
                    </div>
                    <span className="text-slate-500">
                      {format(new Date(share.createdAt), "dd/MM/yy", { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Previsualización del Contenido */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 h-full flex flex-col min-h-[400px]">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-400" />
              Previsualización
            </h3>

            <div className="flex-1 flex items-center justify-center bg-black/45 rounded-xl border border-white/5 overflow-hidden p-4 relative">
              {isImage && previewUrlData?.url ? (
                <img
                  src={previewUrlData.url}
                  alt={file.originalName}
                  className="max-h-[350px] max-w-full object-contain rounded shadow-lg animate-fadeIn"
                />
              ) : file.mimeType === 'application/pdf' && previewUrlData?.url ? (
                <iframe
                  src={previewUrlData.url}
                  className="w-full h-[350px] border-0 rounded"
                  title="PDF Viewer"
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <div className="text-4xl text-slate-600">📁</div>
                  <h4 className="text-slate-400 font-bold text-sm">Vista previa no disponible</h4>
                  <p className="text-slate-600 text-xs max-w-xs">
                    Este formato de archivo ({file.mimeType}) no admite previsualización directa en el navegador. Descarga el archivo para verlo.
                  </p>
                  <button
                    onClick={() => download(file.id, file.originalName)}
                    className="btn-ghost text-xs mt-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar ahora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de borrado */}
      <ConfirmModal
        isOpen={deleteOpen}
        title="¿Eliminar este archivo?"
        message="Esta acción no se puede deshacer y eliminará el archivo de manera definitiva del almacenamiento seguro."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
