import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = '확인',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] bg-black/50" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-[301] w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[.08] bg-bg-secondary p-5 shadow-2xl">
        <h4 className="mb-3 text-sm font-bold text-text-primary">{title}</h4>
        <p className="mb-4 text-xs leading-relaxed text-text-secondary">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors ${
              danger
                ? 'bg-danger hover:bg-danger/80'
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
