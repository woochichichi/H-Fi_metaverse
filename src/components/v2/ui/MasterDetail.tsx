import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, Inbox } from 'lucide-react';

/**
 * v2 대시보드 Master-Detail 2열 레이아웃.
 *
 * - 데스크탑: 좌측 리스트 + 우측 상세 (고정 비율)
 * - 좁은 화면(<920px): 상세 선택 시 리스트를 숨기고 풀폭 상세, 상단에 뒤로가기 버튼
 *
 * 각 페이지는 master(리스트 JSX)와 detail(선택된 항목 상세 JSX)을 주입한다.
 * 선택 여부(hasSelection)로 빈 상태 노출 여부를 제어.
 */
interface Props {
  master: ReactNode;
  detail: ReactNode;
  hasSelection: boolean;
  onBackMobile?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** 좌측 리스트 폭. 기본 380px */
  masterWidth?: number;
}

export default function MasterDetail({
  master,
  detail,
  hasSelection,
  onBackMobile,
  emptyTitle = '항목을 선택하세요',
  emptyDescription = '왼쪽 목록에서 하나를 선택하면 여기에 상세가 표시됩니다.',
  masterWidth = 380,
}: Props) {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 920 : false,
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 920);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 좁은 화면: 선택 상태이면 상세만, 아니면 리스트만
  if (isNarrow) {
    if (hasSelection) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="w-btn w-btn-ghost"
            onClick={onBackMobile}
            style={{ alignSelf: 'flex-start', padding: '6px 10px', fontSize: 12 }}
          >
            <ChevronLeft size={14} />
            <span>목록</span>
          </button>
          <div className="w-card" style={{ padding: 18 }}>
            {detail}
          </div>
        </div>
      );
    }
    return <>{master}</>;
  }

  // 데스크탑: 2열 고정
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${masterWidth}px 1fr`,
        gap: 16,
        alignItems: 'start',
        minHeight: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>{master}</div>
      <div
        className="w-card"
        style={{
          padding: hasSelection ? 22 : 0,
          minHeight: 480,
          position: 'sticky',
          top: 0,
          overflow: 'hidden',
        }}
      >
        {hasSelection ? (
          detail
        ) : (
          <EmptySelection title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </div>
  );
}

function EmptySelection({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: 'var(--w-text-muted)',
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--w-surface-2)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--w-text-muted)',
        }}
      >
        <Inbox size={22} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--w-text-soft)' }}>{title}</div>
      <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

/* =========================================================
   MasterList  좌측 리스트 카드 공통 스타일
   (선택된 항목은 accent-soft 배경 + accent left-bar)
========================================================= */
interface MasterListItemProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function MasterListItem({ selected, onClick, children }: MasterListItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        background: selected ? 'var(--w-accent-soft)' : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${selected ? 'var(--w-accent)' : 'transparent'}`,
        borderBottom: '1px solid var(--w-border)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface-2)';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export function MasterListCard({ children, maxHeight = '70vh' }: { children: ReactNode; maxHeight?: string | number }) {
  return (
    <div
      className="w-card"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight,
      }}
    >
      <div style={{ overflowY: 'auto' }}>{children}</div>
    </div>
  );
}
