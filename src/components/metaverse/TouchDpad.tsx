import { useRef, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 터치 D-pad + 인터랙트 버튼 — 모바일/태블릿(폴드 등)에서 캐릭터 이동용
 * 키보드 keydown/keyup 이벤트를 dispatch하여 PlayerCharacter 게임루프와 동일하게 동작
 */

const DIRECTIONS = [
  { key: 'ArrowUp', icon: ChevronUp, style: 'top-0 left-1/2 -translate-x-1/2' },
  { key: 'ArrowDown', icon: ChevronDown, style: 'bottom-0 left-1/2 -translate-x-1/2' },
  { key: 'ArrowLeft', icon: ChevronLeft, style: 'left-0 top-1/2 -translate-y-1/2' },
  { key: 'ArrowRight', icon: ChevronRight, style: 'right-0 top-1/2 -translate-y-1/2' },
] as const;

function fireKey(key: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

export default function TouchDpad() {
  const activeKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      activeKeysRef.current.forEach((key) => fireKey(key, 'keyup'));
      activeKeysRef.current.clear();
    };
  }, []);

  const handleStart = useCallback((key: string) => {
    if (!activeKeysRef.current.has(key)) {
      activeKeysRef.current.add(key);
      fireKey(key, 'keydown');
    }
  }, []);

  const handleEnd = useCallback((key: string) => {
    if (activeKeysRef.current.has(key)) {
      activeKeysRef.current.delete(key);
      fireKey(key, 'keyup');
    }
  }, []);

  return (
    <>
      {/* 우측 하단: D-pad */}
      <div
        className="fixed bottom-6 right-6 z-[90] h-[120px] w-[120px] select-none"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 rounded-full border border-white/[.08] bg-white/[.04]" />

        {DIRECTIONS.map(({ key, icon: Icon, style }) => (
          <button
            key={key}
            onTouchStart={(e) => { e.preventDefault(); handleStart(key); }}
            onTouchEnd={(e) => { e.preventDefault(); handleEnd(key); }}
            onTouchCancel={() => handleEnd(key)}
            onMouseDown={() => handleStart(key)}
            onMouseUp={() => handleEnd(key)}
            onMouseLeave={() => handleEnd(key)}
            className={`absolute flex h-9 w-9 items-center justify-center rounded-full text-white/40 active:bg-white/15 active:text-white/80 ${style}`}
          >
            <Icon size={18} strokeWidth={2.5} />
          </button>
        ))}

        {/* 중앙 점 (시각적 앵커) */}
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
      </div>

      {/* 좌측 하단: 입장(Space) 버튼 */}
      <button
        onTouchStart={(e) => { e.preventDefault(); fireKey(' ', 'keydown'); }}
        onTouchEnd={(e) => { e.preventDefault(); fireKey(' ', 'keyup'); }}
        onMouseDown={() => fireKey(' ', 'keydown')}
        onMouseUp={() => fireKey(' ', 'keyup')}
        className="fixed bottom-6 left-6 z-[90] flex h-14 w-14 select-none items-center justify-center rounded-full border border-white/[.08] bg-white/[.04] text-[11px] font-bold text-white/40 active:bg-white/15 active:text-white/80"
        style={{ touchAction: 'none' }}
      >
        입장
      </button>
    </>
  );
}
