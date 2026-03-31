import { useState, useCallback } from 'react';
import { ROOMS_DATA } from '../../lib/constants';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';

const CHAR_W = 34;
const CHAR_H = 46;

export default function Zone() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const { nearZone, nearPortal, playerPosition, setMoveTarget, currentRoom } = useMetaverseStore();
  const { openModal } = useUiStore();

  const room = ROOMS_DATA[currentRoom];
  const zones = room.zones;

  const handleZoneClick = useCallback((zoneId: string, zx: number, zy: number, zw: number, zh: number) => {
    const cx = playerPosition.x + CHAR_W / 2;
    const cy = playerPosition.y + CHAR_H / 2;
    if (cx > zx && cx < zx + zw && cy > zy && cy < zy + zh) {
      openModal(zoneId);
    } else {
      setMoveTarget({ x: zx + zw / 2 - CHAR_W / 2, y: zy + zh / 2 - CHAR_H / 2, zoneId });
    }
  }, [playerPosition, setMoveTarget, openModal]);

  return (
    <>
      {zones.map((z) => (
        <div
          key={z.id}
          className="absolute z-[2] cursor-pointer rounded-md transition-all duration-300"
          style={{
            left: z.x, top: z.y, width: z.width, height: z.height,
            background: hoveredZone === z.id ? 'rgba(255,255,255,0.04)' : 'transparent',
          }}
          onClick={(e) => { e.stopPropagation(); handleZoneClick(z.id, z.x, z.y, z.width, z.height); }}
          onMouseEnter={() => setHoveredZone(z.id)}
          onMouseLeave={() => setHoveredZone(null)}
        >
          {hoveredZone === z.id && (
            <div
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium text-white/90 pointer-events-none animate-[fadeIn_.15s]"
              style={{
                bottom: -24,
                zIndex: 100,
                background: 'rgba(30,30,48,.9)',
              }}
            >
              클릭하여 입장
            </div>
          )}
        </div>
      ))}

      {/* 프록시미티 힌트: Zone */}
      {nearZone && !nearPortal && (() => {
        const zone = zones.find((z) => z.id === nearZone);
        if (!zone) return null;
        return (
          <div
            className="absolute z-[90] flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-[5px] text-[12px] font-semibold text-white pointer-events-none animate-[fadeIn_.2s]"
            style={{
              left: playerPosition.x + 17,
              top: playerPosition.y + 58,
              transform: 'translateX(-50%)',
              background: 'rgba(108,92,231,.92)',
              boxShadow: '0 3px 12px rgba(108,92,231,.35)',
            }}
          >
            <span className="rounded bg-white/20 px-[6px] py-[1px] font-mono text-[10px] font-semibold text-white/90">
              Space
            </span>
            {zone.label} 입장
          </div>
        );
      })()}

      {/* 프록시미티 힌트: Portal — 자동 이동이므로 힌트 불필요 */}
    </>
  );
}
