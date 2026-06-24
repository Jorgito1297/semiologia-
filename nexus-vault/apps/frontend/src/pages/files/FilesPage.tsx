import React, { useState } from 'react';
import {
  Files,
  Upload,
  Search,
  Download,
  Trash2,
  Share2,
  Eye,
  ExternalLink,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFiles } from '@/hooks/useFiles';
import { FileUploader } from '@/components/files/FileUploader';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { SkeletonTable } from '@/components/common/LoadingSpinner';
import { FileCategory } from '@/types';
import type { FileMetadata } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const fileCategories: { key: 'ALL' | FileCategory; label: string; icon: string }[] = [
  { key: 'ALL', label: 'Todos', icon: '📁' },
  { key: FileCategory.DOCUMENT, label: 'Documentos', icon: '📄' },
  { key: FileCategory.IMAGE, label: 'Imágenes', icon: '🖼️' },
  { key: FileCategory.SPREADSHEET, label: 'Tablas', icon: '📊' },
  { key: FileCategory.ARCHIVE, label: 'Comprimidos', icon: '🗜️' },
  { key: FileCategory.VIDEO, label: 'Videos', icon: '🎬' },
  { key: FileCategory.AUDIO, label: 'Audio', icon: '🎵' },
  { key: FileCategory.OTHER, label: 'Otros', icon: '📎' },
];

export default function FilesPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<'ALL' | FileCategory>('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);

  // Estados de modales
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<FileMetadata | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [isSharingLocal, setIsSharingLocal] = useState(false);

  // Hook de archivos
  const {
    files,
    meta,
    isLoading,
    download,
    delete: deleteFile,
    isDeleting,
    share,
  } = useFiles(page, 20);

  // Filtrado local por término de búsqueda y categoría
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'ALL' || file.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteConfirm = async () => {
    if (deleteFileId) {
      await deleteFile(deleteFileId);
      setDeleteFileId(null);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareFile || !shareUserId.trim()) return;

    setIsSharingLocal(true);
    try {
      await share({ fileId: shareFile.id, toUserId: shareUserId.trim() });
      setShareFile(null);
      setShareUserId('');
    } catch {
      // toast de error manejado por el hook
    } finally {
      setIsSharingLocal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Mis Archivos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona, descarga y comparte tus documentos de forma segura.
          </p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary">
          <Upload className="w-4 h-4" />
          Subir Archivo
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Campo de búsqueda */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre..."
            className="input-dark pl-10 w-full"
          />
        </div>

        {/* Pestañas de categorías */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {fileCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setCategory(cat.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                category === cat.key
                  ? 'bg-primary-600 text-white shadow-glow border border-primary-500/20'
                  : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Archivos */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={8} />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Files className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-slate-400 font-bold text-lg">No se encontraron archivos</h3>
            <p className="text-slate-600 text-sm mt-1">
              {searchTerm || category !== 'ALL'
                ? 'Intenta cambiar los términos de búsqueda o filtros.'
                : 'Sube tu primer archivo para comenzar.'}
            </p>
            {!searchTerm && category === 'ALL' && (
              <button onClick={() => setUploadOpen(true)} className="btn-primary mt-4">
                <Upload className="w-4 h-4" /> Subir Archivo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-dark">
              <thead>
                <tr>
                  <th className="text-left">Nombre</th>
                  <th className="text-left">Tamaño</th>
                  <th className="text-left">Subido el</th>
                  <th className="text-left">Descargas</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <a
                            href={`/files/${file.id}`}
                            className="text-sm font-medium text-white hover:text-primary-400 flex items-center gap-1 hover:underline truncate max-w-[240px]"
                          >
                            {file.originalName}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={file.id}>
                            ID: {file.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatBytes(file.size)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(file.createdAt), "dd 'de' MMM, yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {file.downloadCount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/files/${file.id}`}
                          title="Detalles"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => download(file.id, file.originalName)}
                          title="Descargar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-success-400 hover:bg-success-500/10 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShareFile(file)}
                          title="Compartir"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteFileId(file.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {meta && meta.pages > 1 && (
        <div className="flex justify-between items-center px-4 py-2 text-sm text-slate-500">
          <span>
            Mostrando página <strong>{page}</strong> de <strong>{meta.pages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-white/[0.03] text-white transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, meta.pages))}
              disabled={page === meta.pages}
              className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-white/[0.03] text-white transition-all"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de subida de archivos */}
      {uploadOpen && (
        <FileUploader onClose={() => setUploadOpen(false)} />
      )}

      {/* Modal de confirmación de borrado */}
      <ConfirmModal
        isOpen={!!deleteFileId}
        title="¿Eliminar archivo?"
        message="Esta acción no se puede deshacer. El archivo será removido permanentemente de tu Vault."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteFileId(null)}
      />

      {/* Modal de compartir archivo */}
      {shareFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShareFile(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Compartir Archivo
              </h3>
              <button onClick={() => setShareFile(null)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-xs mb-4">
              Compartiendo: <strong className="text-white">{shareFile.originalName}</strong>
            </p>

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">ID de Usuario Destinatario</label>
                <input
                  type="text"
                  value={shareUserId}
                  onChange={(e) => setShareUserId(e.target.value)}
                  placeholder="Ingrese el UUID del usuario..."
                  required
                  className="input-dark w-full"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShareFile(null)}
                  className="px-4 py-2 text-sm text-gray-300 border border-white/10 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSharingLocal || !shareUserId.trim()}
                  className="btn-primary min-w-[100px] justify-center"
                >
                  {isSharingLocal ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Compartir'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
