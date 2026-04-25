import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { create } from 'zustand';
import { useThemeStore } from '../../../stores/themeStore';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  items: ToastItem[];
  show: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
}

/**
 * v2 전용 토스트 store. 기존 uiStore.addToast 는 Tailwind 색상이라
 * v2 (.v2-warm/.v2-dark) 토큰과 어울리지 않아 별도 store + UI.
 */
export const useV2Toast = create<ToastState>((set) => ({
  items: [],
  show: (message, type = 'info') =>
    set((s) => ({
      items: [...s.items, { id: crypto.randomUUID(), message, type }],
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

const ICON_MAP = { success: CheckCircle, error: AlertCircle, info: Info };

/** v2 ToastHost — V2Workspace 루트에 1번만 마운트. */
export default function V2ToastHost() {
  const items = useV2Toast((s) => s.items);
  const remove = useV2Toast((s) => s.remove);
  const themeClass = useThemeStore((s) => (s.version === 'dark' ? 'v2-dark' : 'v2-warm'));

  if (items.length === 0) return null;

  return createPortal(
    <div
      className={themeClass}
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {items.map((t) => (
        <ToastItemView key={t.id} item={t} onClose={() => remove(t.id)} />
      ))}
    </div>,
    document.body,
  );
}

function ToastItemView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = ICON_MAP[item.type];
  const tone =
    item.type === 'success'
      ? { bg: 'var(--w-success)', color: '#fff' }
      : item.type === 'error'
        ? { bg: 'var(--w-danger)', color: '#fff' }
        : { bg: 'var(--w-accent)', color: '#fff' };

  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: tone.bg,
        color: tone.color,
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,.18)',
        animation: 'slideUp .25s ease',
        maxWidth: 420,
      }}
    >
      <Icon size={16} />
      <span style={{ flex: 1 }}>{item.message}</span>
      <button
        onClick={onClose}
        style={{
          width: 20,
          height: 20,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.2)',
          border: 0,
          borderRadius: '50%',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        <X size={11} />
      </button>
    </div>
  );
}
