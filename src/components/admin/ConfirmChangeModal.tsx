import { createPortal } from 'react-dom';

interface ConfirmChangeModalProps {
  userName: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmChangeModal({ userName, description, onConfirm, onCancel }: ConfirmChangeModalProps) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] bg-black/50" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-[301] w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[.08] bg-bg-secondary p-5 shadow-2xl">
        <h4 className="mb-3 text-sm font-bold text-text-primary">변경 확인</h4>
        <p className="mb-4 text-xs text-text-secondary">
          <strong>{userName}</strong>님의 {description} 변경하시겠습니까?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/80"
          >
            확인
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
