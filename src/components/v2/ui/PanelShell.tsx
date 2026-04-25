import { Plus, X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * 사이드 패널(작성 폼) 셸 — Master-Detail 의 detail 자리에 모달 대신 작성 폼을 띄울 때.
 * 헤더(타이틀+닫기) + 내용 + 푸터(액션 버튼) 구조.
 */
interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function PanelShell({ title, onClose, children }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'var(--w-surface)',
        border: '1px solid var(--w-border)',
        borderRadius: 12,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} style={{ color: 'var(--w-accent)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-text)' }}>{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          style={{
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            color: 'var(--w-text-muted)',
            border: 0,
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function PanelFoot({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </div>
  );
}
