import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLOR_MAP = {
  success: 'bg-success/90 text-white',
  error: 'bg-danger/90 text-white',
  info: 'bg-accent/90 text-white',
};

export default function Toast() {
  const { toasts, removeToast } = useUiStore();

  return (
    <div className="fixed left-1/2 top-14 z-[300] flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} action={toast.action} onClose={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ id, message, type, action, onClose }: {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    if (action) return; // 액션 버튼 있는 토스트는 사용자가 직접 닫음
    const timer = setTimeout(() => onClose(id), 3500);
    return () => clearTimeout(timer);
  }, [id, onClose, action]);

  const Icon = ICON_MAP[type];

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg ${COLOR_MAP[type]}`}
      style={{
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(0,0,0,.3)',
        animation: 'slideUp .25s ease',
      }}
    >
      <Icon size={16} />
      <span>{message}</span>
      {action && (
        <button
          onClick={() => { action.onClick(); onClose(id); }}
          className="ml-1 rounded-lg bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30 transition-colors"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={() => onClose(id)}
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}
