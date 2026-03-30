import { useState, useEffect } from 'react';
import CharacterSVG from './CharacterSVG';
import { NPC_TEAM, ZONES } from '../../lib/constants';

interface NpcState {
  x: number;
  y: number;
}

export default function NPCCharacter() {
  const [positions, setPositions] = useState<NpcState[]>(() =>
    NPC_TEAM.map((_, i) => ({
      x: 200 + (i % 4) * 200 + Math.random() * 60,
      y: 180 + Math.floor(i / 4) * 300 + Math.random() * 60,
    }))
  );

  // 3.5초마다 랜덤 이동
  useEffect(() => {
    const timer = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos, i) => {
          if (Math.random() < 0.25) {
            const z = ZONES[i % ZONES.length];
            return {
              x: z.x + 40 + Math.random() * (z.width - 100),
              y: z.y + 50 + Math.random() * (z.height - 120),
            };
          }
          return pos;
        })
      );
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {NPC_TEAM.map((npc, i) => (
        <div
          key={i}
          id={`npc-${i}`}
          className="absolute z-20"
          style={{
            left: positions[i].x,
            top: positions[i].y,
            transition: 'left 2.5s ease-in-out, top 2.5s ease-in-out',
            filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.2))',
          }}
        >
          {/* 기분 이모지 */}
          {npc.emoji && (
            <div
              className="absolute left-1/2 -translate-x-1/2 text-sm"
              style={{ top: -32, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.3))' }}
            >
              {npc.emoji}
            </div>
          )}
          {/* 이름표 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[3px] whitespace-nowrap rounded-lg px-2 py-[2px] text-[9px] font-medium text-text-secondary"
            style={{ top: -18, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}
          >
            <span style={{ color: npc.color }}>●</span>
            {npc.name}, {npc.role}
          </div>
          <CharacterSVG color={npc.color} skinColor={npc.skin} hairColor={npc.hair} size={28} />
        </div>
      ))}
    </>
  );
}
