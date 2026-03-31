import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * 가상 조이스틱 + 입장 버튼 — 모바일/태블릿에서 캐릭터 이동용
 * 드래그 방향/크기에 따라 ArrowKey keydown/keyup을 dispatch
 */

const JOYSTICK_RADIUS = 56;  // 조이스틱 배경 반지름
const KNOB_RADIUS = 22;      // 손잡이 반지름
const DEAD_ZONE = 10;         // 데드존 (px) — 이 안에선 이동 없음

function fireKey(key: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

export default function TouchDpad() {
  const activeKeysRef = useRef<Set<string>>(new Set());
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const touchIdRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      activeKeysRef.current.forEach((k) => fireKey(k, 'keyup'));
      activeKeysRef.current.clear();
    };
  }, []);

  const pressKey = useCallback((key: string) => {
    if (!activeKeysRef.current.has(key)) {
      activeKeysRef.current.add(key);
      fireKey(key, 'keydown');
    }
  }, []);

  const releaseKey = useCallback((key: string) => {
    if (activeKeysRef.current.has(key)) {
      activeKeysRef.current.delete(key);
      fireKey(key, 'keyup');
    }
  }, []);

  const updateDirection = useCallback((dx: number, dy: number) => {
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < DEAD_ZONE) {
      // 데드존 안 — 모든 키 해제
      releaseKey('ArrowUp');
      releaseKey('ArrowDown');
      releaseKey('ArrowLeft');
      releaseKey('ArrowRight');
      return;
    }

    // 각도 기반 방향 결정 (8방향 지원: 대각선 이동 가능)
    const angle = Math.atan2(dy, dx); // -PI ~ PI

    // 수평 (-67.5° ~ 67.5° → 오른쪽, 112.5° ~ 247.5° → 왼쪽)
    if (angle > -1.178 && angle < 1.178) {
      pressKey('ArrowRight');
      releaseKey('ArrowLeft');
    } else if (angle > 1.963 || angle < -1.963) {
      pressKey('ArrowLeft');
      releaseKey('ArrowRight');
    } else {
      releaseKey('ArrowLeft');
      releaseKey('ArrowRight');
    }

    // 수직 (22.5° ~ 157.5° → 아래, -157.5° ~ -22.5° → 위)
    if (angle > 0.393 && angle < 2.749) {
      pressKey('ArrowDown');
      releaseKey('ArrowUp');
    } else if (angle > -2.749 && angle < -0.393) {
      pressKey('ArrowUp');
      releaseKey('ArrowDown');
    } else {
      releaseKey('ArrowUp');
      releaseKey('ArrowDown');
    }
  }, [pressKey, releaseKey]);

  const resetJoystick = useCallback(() => {
    setKnob({ x: 0, y: 0 });
    setDragging(false);
    originRef.current = null;
    touchIdRef.current = null;
    releaseKey('ArrowUp');
    releaseKey('ArrowDown');
    releaseKey('ArrowLeft');
    releaseKey('ArrowRight');
  }, [releaseKey]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return; // 이미 조이스틱 사용 중
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!originRef.current || touchIdRef.current === null) return;
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === touchIdRef.current
    );
    if (!touch) return;

    let dx = touch.clientX - originRef.current.x;
    let dy = touch.clientY - originRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 최대 범위 제한
    const maxDist = JOYSTICK_RADIUS - KNOB_RADIUS;
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    setKnob({ x: dx, y: dy });
    updateDirection(dx, dy);
  }, [updateDirection]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === touchIdRef.current
    );
    if (touch) resetJoystick();
  }, [resetJoystick]);

  return (
    <>
      {/* 우측 하단: 조이스틱 */}
      <div
        className="fixed bottom-6 right-6 z-[90] select-none"
        style={{
          width: JOYSTICK_RADIUS * 2,
          height: JOYSTICK_RADIUS * 2,
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetJoystick}
      >
        {/* 배경 링 */}
        <div
          className="absolute inset-0 rounded-full border border-white/[.12] bg-white/[.06]"
          style={{
            boxShadow: dragging
              ? '0 0 20px rgba(255,255,255,0.08), inset 0 0 20px rgba(255,255,255,0.04)'
              : 'inset 0 0 12px rgba(255,255,255,0.02)',
          }}
        />

        {/* 방향 가이드 십자선 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute h-full w-px bg-white/[.06]" />
          <div className="absolute h-px w-full bg-white/[.06]" />
        </div>

        {/* 손잡이 (knob) */}
        <div
          className="absolute rounded-full border border-white/20 bg-white/15 transition-shadow"
          style={{
            width: KNOB_RADIUS * 2,
            height: KNOB_RADIUS * 2,
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
            boxShadow: dragging
              ? '0 0 12px rgba(255,255,255,0.2), inset 0 1px 2px rgba(255,255,255,0.15)'
              : '0 0 6px rgba(255,255,255,0.1), inset 0 1px 2px rgba(255,255,255,0.1)',
          }}
        />
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
