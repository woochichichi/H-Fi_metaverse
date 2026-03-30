import { useState, useCallback } from 'react';
import { ZONES } from '../../lib/constants';
import type { ZoneId } from '../../lib/constants';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';

const CHAR_W = 34;
const CHAR_H = 46;

export default function Zone() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const { nearZone, playerPosition, setMoveTarget } = useMetaverseStore();
  const { openModal } = useUiStore();

  const handleZoneClick = useCallback((zoneId: ZoneId, zx: number, zy: number, zw: number, zh: number) => {
    // 캐릭터 중심이 이미 Zone 안에 있으면 바로 입장
    const cx = playerPosition.x + CHAR_W / 2;
    const cy = playerPosition.y + CHAR_H / 2;
    if (cx > zx && cx < zx + zw && cy > zy && cy < zy + zh) {
      openModal(zoneId);
    } else {
      // Zone 중앙으로 이동 목표 설정 (캐릭터 크기 보정)
      setMoveTarget({ x: zx + zw / 2 - CHAR_W / 2, y: zy + zh / 2 - CHAR_H / 2, zoneId });
    }
  }, [playerPosition, setMoveTarget, openModal]);

  return (
    <>
      {ZONES.map((z) => (
        <div
          key={z.id}
          className="absolute z-[2] cursor-pointer rounded-md transition-all duration-200"
          style={{
            left: z.x, top: z.y, width: z.width, height: z.height,
            outline: hoveredZone === z.id ? '3px solid rgba(108,92,231,.5)' : 'none',
            outlineOffset: hoveredZone === z.id ? 2 : 0,
            background: hoveredZone === z.id ? 'rgba(108,92,231,.04)' : 'transparent',
          }}
          onClick={() => handleZoneClick(z.id, z.x, z.y, z.width, z.height)}
          onMouseEnter={() => setHoveredZone(z.id)}
          onMouseLeave={() => setHoveredZone(null)}
        >
          {/* 호버 힌트 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl px-4 py-[6px] text-[13px] font-bold text-white pointer-events-none transition-all duration-200"
            style={{
              top: -38,
              zIndex: 100,
              background: 'linear-gradient(135deg, rgba(108,92,231,.95), rgba(88,72,211,.9))',
              opacity: hoveredZone === z.id ? 1 : 0,
              transform: `translateX(-50%) translateY(${hoveredZone === z.id ? 0 : 4}px)`,
              backdropFilter: 'blur(6px)',
              boxShadow: '0 6px 20px rgba(108,92,231,.4)',
              letterSpacing: '0.3px',
            }}
          >
            {z.emoji} {z.label} — 클릭 or Space
          </div>
        </div>
      ))}

      {/* 프록시미티 힌트 (캐릭터 하단) */}
      {nearZone && (() => {
        const zone = ZONES.find((z) => z.id === nearZone);
        if (!zone) return null;
        return (
          <div
            className="absolute z-[90] flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-[13px] font-bold text-white pointer-events-none animate-[fadeIn_.2s]"
            style={{
              left: playerPosition.x + 17,
              top: playerPosition.y + 60,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, rgba(108,92,231,.95), rgba(88,72,211,.9))',
              boxShadow: '0 6px 20px rgba(108,92,231,.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="rounded-md bg-white/25 px-2 py-[2px] font-mono text-[10px] font-bold text-white">
              Space
            </span>
            {zone.emoji} {zone.label} 입장
          </div>
        );
      })()}
    </>
  );
}
