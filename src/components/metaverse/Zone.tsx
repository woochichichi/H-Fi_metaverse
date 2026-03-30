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
          {/* 호버 힌트: 간결하게 '클릭 or Space' 만 표시 (zone 라벨과 중복 방지) */}
          {hoveredZone === z.id && (
            <div
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-medium text-white/80 pointer-events-none animate-[fadeIn_.15s]"
              style={{
                bottom: -24,
                zIndex: 100,
                background: 'rgba(30,30,48,.85)',
                backdropFilter: 'blur(4px)',
              }}
            >
              클릭하여 입장
            </div>
          )}
        </div>
      ))}

      {/* 프록시미티 힌트 (캐릭터 하단) */}
      {nearZone && (() => {
        const zone = ZONES.find((z) => z.id === nearZone);
        if (!zone) return null;
        return (
          <div
            className="absolute z-[90] flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-[5px] text-[12px] font-semibold text-white pointer-events-none animate-[fadeIn_.2s]"
            style={{
              left: playerPosition.x + 17,
              top: playerPosition.y + 58,
              transform: 'translateX(-50%)',
              background: 'rgba(108,92,231,.9)',
              boxShadow: '0 3px 12px rgba(108,92,231,.35)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <span className="rounded bg-white/20 px-[6px] py-[1px] font-mono text-[9px] font-semibold text-white/90">
              Space
            </span>
            {zone.emoji} {zone.label} 입장
          </div>
        );
      })()}
    </>
  );
}
