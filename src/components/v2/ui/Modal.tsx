import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

/**
 * v2 스코프가 보장되는 모달.
 * createPortal로 body에 렌더되므로 스코프 클래스를 루트에 다시 붙여야 한다.
 */
export default function Modal({ open, onClose, title, children, width = 520, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="v2-dark" style={{ position: 'fixed', inset: 0, zIndex: 400 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `min(${width}px, calc(100vw - 32px))`,
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--w-surface)',
          borderRadius: 'var(--w-radius-lg)',
          boxShadow: 'var(--w-shadow-lg)',
          border: '1px solid var(--w-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--w-border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--w-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-btn w-btn-ghost"
            style={{ padding: 6, border: 'none' }}
            title="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '12px 18px',
              borderTop: '1px solid var(--w-border)',
              background: 'var(--w-surface-2)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
