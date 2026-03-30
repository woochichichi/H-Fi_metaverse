import { useState, useEffect } from 'react';
import CharacterSVG from './CharacterSVG';
import { NPC_TEAM, ROOMS_DATA } from '../../lib/constants';
import { useMetaverseStore } from '../../stores/metaverseStore';

interface NpcState {
  x: number;
  y: number;
}

export default function NPCCharacter() {
  const currentRoom = useMetaverseStore((s) => s.currentRoom);
  const room = ROOMS_DATA[currentRoom];

  // 현재 룸에 해당하는 NPC만 필터
  const visibleNpcs = NPC_TEAM.filter((npc) => room.npcTeams.includes(npc.team));

  // NPC 초기 위치: 룸 Zone 내 랜덤
  const getSpawn = (team: string): { x: number; y: number } => {
    const zones = room.zones.filter((z) => z.team === team || z.team === null);
    if (zones.length > 0) {
      const z = zones[Math.floor(Math.random() * zones.length)];
      return {
        x: z.x + 30 + Math.random() * (z.width - 80),
        y: z.y + 30 + Math.random() * (z.height - 80),
      };
    }
    return {
      x: room.spawnPoint.x + (Math.random() - 0.5) * 100,
      y: room.spawnPoint.y + (Math.random() - 0.5) * 100,
    };
  };

  const [positions, setPositions] = useState<NpcState[]>(() =>
    visibleNpcs.map((npc) => getSpawn(npc.team))
  );

  // 룸 변경 시 위치 리셋
  useEffect(() => {
    setPositions(visibleNpcs.map((npc) => getSpawn(npc.team)));
  }, [currentRoom]);

  // 3.5초마다 같은 룸 Zone 내에서 랜덤 이동
  useEffect(() => {
    const timer = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos, i) => {
          if (Math.random() < 0.25) {
            const npc = visibleNpcs[i];
            if (!npc) return pos;
            const zones = room.zones.filter((z) => z.team === npc.team || z.team === null);
            if (zones.length > 0) {
              const z = zones[Math.floor(Math.random() * zones.length)];
              return {
                x: z.x + 30 + Math.random() * Math.max(0, z.width - 80),
                y: z.y + 30 + Math.random() * Math.max(0, z.height - 80),
              };
            }
            return getSpawn(npc.team);
          }
          return pos;
        })
      );
    }, 3500);
    return () => clearInterval(timer);
  }, [currentRoom]);

  return (
    <>
      {visibleNpcs.map((npc, i) => (
        <div
          key={`${currentRoom}-${npc.name}`}
          className="absolute z-20"
          style={{
            left: positions[i]?.x ?? room.spawnPoint.x,
            top: positions[i]?.y ?? room.spawnPoint.y,
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
