import { useState, useEffect } from 'react';
import CharacterSVG from './CharacterSVG';
import { NPC_TEAM, TEAM_ZONES, SHARED_ZONES, TEAM_CONFIGS } from '../../lib/constants';
import type { TeamConfigKey } from '../../lib/constants';

interface NpcState {
  x: number;
  y: number;
}

// NPC의 팀에 해당하는 타운 내 랜덤 위치
function getTeamSpawn(team: string): { x: number; y: number } {
  const cfg = TEAM_CONFIGS[team as TeamConfigKey];
  if (cfg) {
    const t = cfg.town;
    return {
      x: t.x + 60 + Math.random() * (t.w - 120),
      y: t.y + 60 + Math.random() * (t.h - 120),
    };
  }
  // 팀 매칭 안 되면 중앙 광장
  return { x: 1100 + Math.random() * 200, y: 800 + Math.random() * 200 };
}

export default function NPCCharacter() {
  const [positions, setPositions] = useState<NpcState[]>(() =>
    NPC_TEAM.map((npc) => getTeamSpawn(npc.team))
  );

  // 3.5초마다 같은 팀 타운 내에서 랜덤 이동
  useEffect(() => {
    const teamZones = [...TEAM_ZONES, ...SHARED_ZONES];
    const timer = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos, i) => {
          if (Math.random() < 0.25) {
            const npc = NPC_TEAM[i];
            // 같은 팀의 Zone들 중 하나로 이동
            const myZones = teamZones.filter((z) => z.team === npc.team);
            if (myZones.length > 0) {
              const z = myZones[Math.floor(Math.random() * myZones.length)];
              return {
                x: z.x + 30 + Math.random() * (z.width - 80),
                y: z.y + 30 + Math.random() * (z.height - 80),
              };
            }
            return getTeamSpawn(npc.team);
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
          {npc.emoji && (
            <div
              className="absolute left-1/2 -translate-x-1/2 text-sm"
              style={{ top: -32, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.3))' }}
            >
              {npc.emoji}
            </div>
          )}
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
