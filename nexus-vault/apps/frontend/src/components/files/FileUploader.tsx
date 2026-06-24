import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image,
  FileSpreadsheet,
  Archive,
  Film,
  Music,
  File,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useFilesStore } from '@/store/files.store';
import type { ApiResponse, FileMetadata, UploadingFile } from '@/types';

// Native UUID generator fallback
const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ---- Constants ----
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Media
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
];

// ---- File icon resolver ----
function FileIcon({ mimeType, className = 'w-5 h-5' }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/'))         return <Image         className={clsx(className, 'text-purple-400')} />;
  if (mimeType.startsWith('video/'))         return <Film          className={clsx(className, 'text-pink-400')} />;
  if (mimeType.startsWith('audio/'))         return <Music         className={clsx(className, 'text-indigo-400')} />;
  if (mimeType === 'application/pdf')        return <FileText      className={clsx(className, 'text-red-400')} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
                                             return <FileSpreadsheet className={clsx(className, 'text-success-400')} />;
  if (mimeType.includes('word') || mimeType.includes('document'))
                                             return <FileText      className={clsx(className, 'text-blue-400')} />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z'))
                                             return <Archive       className={clsx(className, 'text-orange-400')} />;
  return <File className={clsx(className, 'text-slate-400')} />;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---- Upload item row ----
function UploadItem({ item, onCancel }: { item: UploadingFile; onCancel: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <FileIcon mimeType={item.file.type} />
      </div>

      {/* Info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-white truncate max-w-[200px]">{item.file.name}</p>
          <span className="text-[10px] text-slate-500 ml-2 flex-shrink-0">{formatBytes(item.file.size)}</span>
        </div>

        {/* Progress bar */}
        {item.status === 'uploading' && (
          <div className="progress-bar">
            <div
              className="progress-bar-fill transition-all duration-200"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}

        {/* Status */}
        {item.status === 'success' && (
          <div className="flex items-center gap-1 text-success-400">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px] font-medium">Cargado con éxito</span>
          </div>
        )}
        {item.status === 'error' && (
          <div className="flex items-center gap-1 text-danger-400">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[10px] font-medium">{item.error ?? 'Error al cargar'}</span>
          </div>
        )}
        {item.status === 'pending' && (
          <span className="text-[10px] text-slate-500">Esperando…</span>
        )}
      </div>

      {/* Cancel / remove */}
      {item.status !== 'success' && (
        <button
          onClick={() => onCancel(item.id)}
          className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {item.status === 'success' && (
        <CheckCircle2 className="w-4 h-4 text-success-400 flex-shrink-0" />
      )}
    </div>
  );
}

// ================================================================
// FILE UPLOADER
// ================================================================
interface FileUploaderProps {
  onClose: () => void;
}

export function FileUploader({ onClose }: FileUploaderProps) {
  const { uploadQueue, addToQueue, removeFromQueue, setProgress, setStatus, setUploading, addFile } = useFilesStore();
  const [isDragging, setIsDragging] = useState(false);

  // ---- Validate file ----
  function validate(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) return `Archivo demasiado grande (máx 50 MB). Tamaño: ${formatBytes(file.size)}`;
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') return `Tipo de archivo no permitido: ${file.type}`;
    return null;
  }

  // ---- Upload single file ----
  async function uploadFile(item: UploadingFile) {
    const err = validate(item.file);
    if (err) {
      setStatus(item.id, 'error', err);
      return;
    }

    setStatus(item.id, 'uploading');

    const formData = new FormData();
    formData.append('file', item.file);

    try {
      const res = await api.post<ApiResponse<FileMetadata>>('/api/v1/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(item.id, Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });
      setStatus(item.id, 'success');
      addFile(res.data.data);
      toast.success(`¡${item.file.name} cargado con éxito!`);
    } catch {
      setStatus(item.id, 'error', 'Error al cargar. Intente nuevamente.');
    }
  }

  // ---- Handle drop ----
  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    // Handle rejected
    rejected.forEach(({ file, errors }) => {
      toast.error(`${file.name}: ${errors[0]?.message ?? 'Archivo no válido'}`);
    });

    // Add accepted to queue
    const newItems: UploadingFile[] = accepted.map(file => ({
      id:       uuidv4(),
      file,
      progress: 0,
      status:   'pending',
    }));
    newItems.forEach(addToQueue);
  }, [addToQueue]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  // ---- Start all uploads ----
  async function startUploads() {
    const pending = uploadQueue.filter(f => f.status === 'pending');
    if (pending.length === 0) return;

    setUploading(true);
    await Promise.allSettled(pending.map(uploadFile));
    setUploading(false);
  }

  const hasPending  = uploadQueue.some(f => f.status === 'pending');
  const allDone     = uploadQueue.length > 0 && uploadQueue.every(f => f.status === 'success' || f.status === 'error');
  const successCount = uploadQueue.filter(f => f.status === 'success').length;

  return (
    <div className="modal-overlay animate-fadeIn" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong rounded-3xl p-7 w-full max-w-lg shadow-2xl animate-slideUp">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Subir Archivos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Máx 50 MB por archivo · PDF, Word, Excel, Imágenes y más</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-primary-500/80 bg-primary-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]',
          )}
        >
          <input {...getInputProps()} />
          <div className={clsx(
            'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-200',
            isDragging ? 'bg-primary-500/20 scale-110' : 'bg-white/5',
          )}>
            <Upload className={clsx('w-6 h-6', isDragging ? 'text-primary-400' : 'text-slate-500')} />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {isDragging ? '¡Suelte los archivos aquí!' : 'Arrastre y suelte archivos aquí'}
          </p>
          <p className="text-xs text-slate-500">
            o <span className="text-primary-400 font-medium hover:text-primary-300">explore su computadora</span>
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {['PDF', 'Word', 'Excel', 'PNG', 'JPG', 'ZIP'].map(ext => (
              <span key={ext} className="badge bg-white/5 text-slate-400 border border-white/10 text-[10px]">{ext}</span>
            ))}
          </div>
        </div>

        {/* Upload queue */}
        {uploadQueue.length > 0 && (
          <div className="mt-5 space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {uploadQueue.map(item => (
              <UploadItem
                key={item.id}
                item={item}
                onCancel={(id) => removeFromQueue(id)}
              />
            ))}
          </div>
        )}

        {/* All done message */}
        {allDone && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-success-500/10 border border-success-500/20">
            <CheckCircle2 className="w-4 h-4 text-success-400" />
            <span className="text-sm text-success-400 font-medium">
              {successCount} archivo{successCount !== 1 ? 's' : ''} cargado{successCount !== 1 ? 's' : ''} con éxito
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">
            {allDone ? 'Listo' : 'Cancelar'}
          </button>
          {hasPending && (
            <button onClick={startUploads} className="btn-primary flex-1">
              <Upload className="w-4 h-4" />
              Subir {uploadQueue.filter(f => f.status === 'pending').length} Archivo{uploadQueue.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

