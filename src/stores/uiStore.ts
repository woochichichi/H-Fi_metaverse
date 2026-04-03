import { create } from 'zustand';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface UiState {
  sidebarOpen: boolean;
  modalOpen: string | null;
  modalContext: Record<string, string> | null;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; action?: ToastAction }>;
  toggleSidebar: () => void;
  openModal: (id: string, context?: Record<string, string>) => void;
  closeModal: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info', action?: ToastAction) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  modalOpen: null,
  modalContext: null,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (id, context) => set({ modalOpen: id, modalContext: context ?? null, sidebarOpen: false }),
  closeModal: () => set({ modalOpen: null, modalContext: null }),
  addToast: (message, type = 'info', action) =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), message, type, action }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
