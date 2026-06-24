import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useFilesStore } from '@/store/files.store';
import type { FileMetadata, PaginatedResponse } from '@/types';

export function useFiles(page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const { setFiles, setProgress } = useFilesStore();

  // ── List files ──────────────────────────────────────────────────────────────
  const filesQuery = useQuery({
    queryKey: ['files', page, limit],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<FileMetadata>>('/v1/files', {
        params: { page, limit },
      });
      setFiles(res.data.data);
      return res.data;
    },
  });

  // ── Upload ───────────────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post<FileMetadata>('/v1/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 1),
          );
          const fileEntry = formData.get('file');
          const fileName =
            fileEntry instanceof File ? fileEntry.name : 'file';
          setProgress(fileName, pct);
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Archivo subido correctamente');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al subir archivo';
      toast.error(message);
    },
  });

  // ── Download (signed URL) ────────────────────────────────────────────────────
  const downloadFile = useCallback(
    async (fileId: string, fileName: string) => {
      try {
        const res = await api.get<{ url: string; expiresAt: string }>(
          `/v1/files/${fileId}/download`,
        );
        const link = document.createElement('a');
        link.href = res.data.url;
        link.download = fileName;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Descarga iniciada');
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? 'Error al descargar archivo';
        toast.error(message);
      }
    },
    [],
  );

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => api.delete(`/v1/files/${fileId}`),
    onSuccess: () => {
      toast.success('Archivo eliminado');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al eliminar archivo';
      toast.error(message);
    },
  });

  // ── Share ────────────────────────────────────────────────────────────────────
  const shareMutation = useMutation({
    mutationFn: ({
      fileId,
      toUserId,
    }: {
      fileId: string;
      toUserId: string;
    }) => api.post(`/v1/files/${fileId}/share`, { toUserId }),
    onSuccess: () => toast.success('Archivo compartido'),
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al compartir';
      toast.error(message);
    },
  });

  return {
    files: filesQuery.data?.data ?? [],
    meta: filesQuery.data?.pagination,
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    download: downloadFile,
    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    share: shareMutation.mutateAsync,
    refetch: filesQuery.refetch,
  };
}
