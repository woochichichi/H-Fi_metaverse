import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  modalOpen: string | null;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  modalOpen: null,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (id) => set({ modalOpen: id, sidebarOpen: false }),
  closeModal: () => set({ modalOpen: null }),
  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
