import { create } from 'zustand';
import type { FileMetadata, UploadingFile } from '@/types';

interface FilesState {
  files:          FileMetadata[];
  uploadQueue:    UploadingFile[];
  isUploading:    boolean;
  uploadProgress: Record<string, number>; // fileId → 0-100
  // File list actions
  setFiles:   (files: FileMetadata[])          => void;
  addFile:    (file: FileMetadata)             => void;
  removeFile: (fileId: string)                 => void;
  updateFile: (fileId: string, patch: Partial<FileMetadata>) => void;
  // Upload queue actions
  addToQueue:      (item: UploadingFile)       => void;
  removeFromQueue: (id: string)                => void;
  setProgress:     (id: string, progress: number) => void;
  setStatus:       (id: string, status: UploadingFile['status'], error?: string) => void;
  clearQueue:      ()                          => void;
  setUploading:    (v: boolean)               => void;
}

export const useFilesStore = create<FilesState>()((set) => ({
  files:          [],
  uploadQueue:    [],
  isUploading:    false,
  uploadProgress: {},

  setFiles: (files) => set({ files }),

  addFile: (file) =>
    set((s) => ({ files: [file, ...s.files] })),

  removeFile: (fileId) =>
    set((s) => ({ files: s.files.filter((f) => f.id !== fileId) })),

  updateFile: (fileId, patch) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === fileId ? { ...f, ...patch } : f)),
    })),

  addToQueue: (item) =>
    set((s) => ({ uploadQueue: [...s.uploadQueue, item] })),

  removeFromQueue: (id) =>
    set((s) => ({
      uploadQueue:    s.uploadQueue.filter((f) => f.id !== id),
      uploadProgress: Object.fromEntries(
        Object.entries(s.uploadProgress).filter(([k]) => k !== id),
      ),
    })),

  setProgress: (id, progress) =>
    set((s) => ({
      uploadProgress: { ...s.uploadProgress, [id]: progress },
      uploadQueue:    s.uploadQueue.map((f) =>
        f.id === id ? { ...f, progress } : f,
      ),
    })),

  setStatus: (id, status, error) =>
    set((s) => ({
      uploadQueue: s.uploadQueue.map((f) =>
        f.id === id ? { ...f, status, error } : f,
      ),
    })),

  clearQueue: () =>
    set({ uploadQueue: [], uploadProgress: {}, isUploading: false }),

  setUploading: (v) => set({ isUploading: v }),
}));
