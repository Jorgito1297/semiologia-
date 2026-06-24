import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  notifications: Notification[];
  isGlobalLoading: boolean;
  theme: 'dark' | 'light';
  // Actions
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  activeModal: null,
  notifications: [],
  isGlobalLoading: false,
  theme: 'dark',

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openModal: (modalId) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newNotif: Notification = { ...notification, id };
    set((state) => ({ notifications: [...state.notifications, newNotif] }));
    // Auto-remove after duration (default 5 s); pass duration: 0 to persist
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => get().removeNotification(id), duration);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
