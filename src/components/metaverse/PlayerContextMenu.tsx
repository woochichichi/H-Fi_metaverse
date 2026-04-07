import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
}

interface PlayerContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function PlayerContextMenu({ x, y, items, onClose }: PlayerContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleContextMenu = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // 다음 tick에 등록 (현재 우클릭 이벤트가 먼저 처리된 후)
    const t = setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 화면 밖으로 나가지 않도록 위치 보정 (메뉴 폭 200px 여유)
  const menuWidth = 200;
  const menuHeight = items.length * 40 + 16;
  const adjustedX = x + menuWidth > window.innerWidth
    ? Math.max(0, x - menuWidth)  // 오른쪽 넘치면 왼쪽에 표시
    : x;
  const adjustedY = Math.min(y, window.innerHeight - menuHeight);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[160px] overflow-hidden rounded-xl py-1 shadow-2xl"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'rgba(20, 20, 35, 0.96)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn .12s ease-out',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-medium text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && <span className="text-base">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
