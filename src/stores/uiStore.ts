import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  modalOpen: string | null;
  modalContext: Record<string, string> | null;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  toggleSidebar: () => void;
  openModal: (id: string, context?: Record<string, string>) => void;
  closeModal: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
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
  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
