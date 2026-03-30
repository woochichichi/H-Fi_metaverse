import { useState } from 'react';
import { ZONES } from '../../lib/constants';
import { useMetaverseStore } from '../../stores/metaverseStore';

export default function Zone() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const { nearZone } = useMetaverseStore();

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
          onMouseEnter={() => setHoveredZone(z.id)}
          onMouseLeave={() => setHoveredZone(null)}
        >
          {/* 호버 힌트 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[10px] px-3 py-1 text-[11px] font-semibold text-white pointer-events-none transition-opacity duration-200"
            style={{
              top: -28,
              background: 'rgba(108,92,231,.92)',
              opacity: hoveredZone === z.id ? 1 : 0,
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 12px rgba(108,92,231,.3)',
            }}
          >
            {z.emoji} {z.label} — Space로 입장
          </div>
        </div>
      ))}

      {/* 프록시미티 힌트 (하단 중앙) */}
      {nearZone && (() => {
        const zone = ZONES.find((z) => z.id === nearZone);
        if (!zone) return null;
        return (
          <div
            className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[14px] px-[18px] py-2 text-xs font-semibold text-white animate-[fadeIn_.2s]"
            style={{
              background: 'rgba(108,92,231,.92)',
              boxShadow: '0 6px 20px rgba(108,92,231,.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="rounded-[5px] bg-white/20 px-[7px] py-[3px] font-mono text-[9px] font-bold text-white">
              Space
            </span>
            {zone.emoji} {zone.label} 입장
          </div>
        );
      })()}
    </>
  );
}
