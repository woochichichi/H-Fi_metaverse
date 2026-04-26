import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface NoticeItem {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  body: ReactNode;
}

/**
 * 페이지 상단 안내 카드 — 3개 항목을 grid 로 노출.
 * VOC/공지/아이디어/조직활동 등 첫 사용자가 의도와 정책을 빠르게 파악하도록.
 */
export default function IntroNotice({ items }: { items: NoticeItem[] }) {
  return (
    <div
      className="w-card"
      style={{
        padding: 14,
        marginBottom: 14,
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 14,
        background: 'var(--w-surface)',
        border: '1px solid var(--w-border)',
      }}
    >
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            <Icon size={18} style={{ color: it.iconColor, flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{it.title}</div>
              <div style={{ fontSize: 12, color: 'var(--w-text-soft)', lineHeight: 1.5 }}>
                {it.body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
