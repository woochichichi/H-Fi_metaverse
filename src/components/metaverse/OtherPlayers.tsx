import { useEffect, useRef } from 'react';
import CharacterSVG from './CharacterSVG';
import { useMetaverseStore, type OtherPlayer } from '../../stores/metaverseStore';
import { TEAM_COLORS, type HairStyle, type Accessory } from '../../lib/constants';

const LERP_SPEED = 0.15;
const CHAR_W = 30;

function OtherPlayerSprite({ player }: { player: OtherPlayer }) {
  const colors = TEAM_COLORS[player.team] || { body: '#999', hair: '#444' };

  return (
    <div
      className="absolute z-40 pointer-events-none transition-opacity duration-300"
      style={{
        left: player.x,
        top: player.y,
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.2))',
        opacity: 0.85,
      }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-[10px] px-[8px] py-[2px] text-[11px] font-semibold text-white"
        style={{
          top: -20,
          background: `${player.avatarColor || colors.body}cc`,
          boxShadow: `0 2px 6px ${player.avatarColor || colors.body}40`,
        }}
      >
        <span
          className="inline-block h-[5px] w-[5px] rounded-full"
          style={{ background: '#00D68F' }}
        />
        {player.name}
      </div>
      <CharacterSVG
        color={player.avatarColor || colors.body}
        skinColor={player.skinColor || '#FFE0BD'}
        hairColor={player.hairColor || colors.hair}
        hairStyle={(player.hairStyle as HairStyle) || 'default'}
        accessory={(player.accessory as Accessory) || 'none'}
        size={CHAR_W}
      />
    </div>
  );
}

export default function OtherPlayers() {
  const otherPlayers = useMetaverseStore((s) => s.otherPlayers);
  const currentRoom = useMetaverseStore((s) => s.currentRoom);
  const playersRef = useRef(otherPlayers);
  const rafRef = useRef(0);

  useEffect(() => {
    playersRef.current = otherPlayers;
  }, [otherPlayers]);

  // Lerp 루프: targetX/Y → x/y 보간 (Map 복사는 변경 시에만)
  useEffect(() => {
    const store = useMetaverseStore;

    const loop = () => {
      const players = playersRef.current;
      let next: Map<string, OtherPlayer> | null = null;

      for (const [id, p] of players) {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          if (!next) next = new Map(players);
          next.set(id, {
            ...p,
            x: p.x + dx * LERP_SPEED,
            y: p.y + dy * LERP_SPEED,
          });
        }
      }

      if (next) {
        store.setState({ otherPlayers: next });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const visible = Array.from(otherPlayers.values()).filter(
    (p) => p.room === currentRoom
  );

  return (
    <>
      {visible.map((p) => (
        <OtherPlayerSprite key={p.userId} player={p} />
      ))}
    </>
  );
}
