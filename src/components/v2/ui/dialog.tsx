import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { create } from 'zustand';
import { AlertTriangle } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';

interface ConfirmRequest {
  id: string;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'accent';
  resolve: (ok: boolean) => void;
}

interface ConfirmState {
  current: ConfirmRequest | null;
  ask: (req: Omit<ConfirmRequest, 'id' | 'resolve'>) => Promise<boolean>;
  close: (ok: boolean) => void;
}

/**
 * v2 전용 Promise 기반 confirm — window.confirm 대체.
 *   const ok = await confirm({ title: '쪽지 삭제', message: '복구할 수 없습니다' });
 */
const useV2Confirm = create<ConfirmState>((set, get) => ({
  current: null,
  ask: (req) =>
    new Promise<boolean>((resolve) => {
      set({ current: { ...req, id: crypto.randomUUID(), resolve } });
    }),
  close: (ok) => {
    const cur = get().current;
    if (cur) cur.resolve(ok);
    set({ current: null });
  },
}));

export function confirm(req: Omit<ConfirmRequest, 'id' | 'resolve'>): Promise<boolean> {
  return useV2Confirm.getState().ask(req);
}

/** ConfirmDialog Host — V2Workspace 루트에 1번 마운트. */
export default function V2ConfirmHost() {
  const current = useV2Confirm((s) => s.current);
  const close = useV2Confirm((s) => s.close);
  const themeClass = useThemeStore((s) => (s.version === 'dark' ? 'v2-dark' : 'v2-warm'));

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, close]);

  if (!current) return null;

  const tone = current.tone ?? 'danger';
  const confirmBg = tone === 'danger' ? 'var(--w-danger)' : 'var(--w-accent)';

  return createPortal(
    <div className={themeClass} style={{ position: 'fixed', inset: 0, zIndex: 600 }}>
      <div
        onClick={() => close(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(42,31,26,.22)' }}
      />
      <div
        role="alertdialog"
        aria-modal
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(380px, calc(100vw - 32px))',
          background: 'var(--w-surface)',
          border: '1px solid var(--w-border)',
          borderRadius: 'var(--w-radius-lg)',
          boxShadow: 'var(--w-shadow-lg)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 22px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: tone === 'danger' ? 'var(--w-danger-soft)' : 'var(--w-accent-soft)',
              color: tone === 'danger' ? 'var(--w-danger)' : 'var(--w-accent-hover)',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--w-text)', marginBottom: 4 }}>
              {current.title}
            </div>
            {current.message && (
              <div style={{ fontSize: 12.5, color: 'var(--w-text-soft)', lineHeight: 1.6 }}>
                {current.message}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 18px 14px' }}>
          <button type="button" onClick={() => close(false)} className="w-btn w-btn-ghost" style={{ minWidth: 64 }}>
            {current.cancelLabel ?? '취소'}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="w-btn"
            style={{ minWidth: 64, background: confirmBg, color: '#fff', border: 0, fontWeight: 700 }}
          >
            {current.confirmLabel ?? '확인'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
