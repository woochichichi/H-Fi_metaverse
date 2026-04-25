import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useThemeStore } from '../../../stores/themeStore';

/**
 * v2 공용 hover 툴팁 — 단일 디자인 source of truth.
 * children 을 wrapping. portal 로 body 에 띄워 부모 overflow:hidden /
 * z-index stacking 영향 없이 항상 보이게.
 *
 * 디자인: #1f1a18 다크 배경 / #fbf6ef 텍스트 / 8px radius / 6,24 shadow.
 * 모든 v2 화면의 툴팁은 이 컴포넌트로 통일.
 */
export function Tip({ content, children }: { content: string | ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const themeClass = useThemeStore((s) => (s.version === 'dark' ? 'v2-dark' : 'v2-warm'));

  useEffect(() => {
    if (!pos) return;
    const update = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setPos({ x: r.left + r.width / 2, y: r.top });
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [pos]);

  const onEnter = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: r.left + r.width / 2, y: r.top });
  };

  return (
    <>
      <span
        ref={ref}
        style={{ display: 'inline-flex', alignItems: 'center' }}
        onMouseEnter={onEnter}
        onMouseLeave={() => setPos(null)}
      >
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            className={themeClass}
            style={{
              position: 'fixed',
              left: pos.x,
              top: pos.y - 10,
              transform: 'translate(-50%, -100%)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                minWidth: 220,
                maxWidth: 340,
                padding: '10px 14px',
                background: '#1f1a18',
                color: '#fbf6ef',
                borderRadius: 8,
                fontSize: 11.5,
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                boxShadow: '0 6px 24px rgba(0,0,0,.28)',
              }}
            >
              {content}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #1f1a18',
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

/** "?" 아이콘 헬프 도트 — 헤더 옆 hover 가이드용. */
export function HelpDot({ tip }: { tip: ReactNode }) {
  return (
    <Tip content={tip}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'var(--w-surface-2)',
          color: 'var(--w-text-muted)',
          fontSize: 10,
          fontWeight: 700,
          cursor: 'help',
        }}
      >
        ?
      </span>
    </Tip>
  );
}
