import { useEffect, useRef, useState } from 'react';
import CharacterSVG, { type Direction, type IdleAnim } from './CharacterSVG';
import CharacterPet from './CharacterPet';
import TypingBubble from './TypingBubble';
import { useMetaverseStore, type OtherPlayer } from '../../stores/metaverseStore';
import { TEAM_COLORS, type HairStyle, type Accessory, type PetType } from '../../lib/constants';

const LERP_SPEED = 0.15;
const CHAR_W = 30;
const WALK_FRAME_INTERVAL = 150;
const IDLE_TIMEOUT = 5000;
const IDLE_ANIMS: IdleAnim[] = ['tilt', 'sleep', 'stretch', 'dance'];

interface OtherPlayerSpriteProps {
  player: OtherPlayer;
  onRightClick?: (player: OtherPlayer, clientX: number, clientY: number) => void;
}

function OtherPlayerSprite({ player, onRightClick }: OtherPlayerSpriteProps) {
  const colors = TEAM_COLORS[player.team] || { body: '#999', hair: '#444' };
  const isTyping = useMetaverseStore((s) => s.typingUsers.has(player.userId));

  const [animFrame, setAnimFrame] = useState(0);
  const [idleAnim, setIdleAnim] = useState<IdleAnim>('none');
  const dirRef = useRef<Direction>('right');
  const lastMoveRef = useRef(Date.now());

  // 이동 상태 (derived — state 아닌 매 렌더 계산)
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const isMoving = Math.abs(dx) > 1 || Math.abs(dy) > 1;

  // 방향 추적 (ref만, setState 없음 — 리렌더는 player.x/y가 담당)
  if (isMoving && Math.abs(dx) > 1) {
    dirRef.current = dx > 0 ? 'right' : 'left';
  }
  if (isMoving) {
    lastMoveRef.current = Date.now();
  }

  // 걷기 프레임
  useEffect(() => {
    if (!isMoving) { setAnimFrame(0); return; }
    const timer = setInterval(() => {
      setAnimFrame((f) => (f === 1 ? 2 : 1));
    }, WALK_FRAME_INTERVAL);
    return () => clearInterval(timer);
  }, [isMoving]);

  // idle 모션 — isMoving 전환 시 리셋 + 타이머
  useEffect(() => {
    if (isMoving) {
      setIdleAnim('none');
      return;
    }
    const timer = setInterval(() => {
      if (Date.now() - lastMoveRef.current >= IDLE_TIMEOUT) {
        setIdleAnim((prev) => {
          const idx = IDLE_ANIMS.indexOf(prev);
          return IDLE_ANIMS[(idx + 1) % IDLE_ANIMS.length];
        });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isMoving]);

  const petType = (player.pet || 'none') as PetType;
  const resolvedDir = player.direction || dirRef.current;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onRightClick) return;
    e.preventDefault();
    e.stopPropagation();
    onRightClick(player, e.clientX, e.clientY);
  };

  return (
    <div
      className="absolute z-40 transition-opacity duration-300"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${player.x}px, ${player.y}px)`,
        willChange: 'transform',
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.2))',
        opacity: 0.85,
        // 우클릭 이벤트만 수신, 좌클릭은 차단하지 않음
        pointerEvents: onRightClick ? 'auto' : 'none',
        cursor: onRightClick ? 'context-menu' : 'default',
      }}
      onContextMenu={handleContextMenu}
      // 좌클릭은 맵으로 전파 (이동 동작 유지)
      onClick={(e) => e.stopPropagation()}
    >
      {(isTyping || player.isTyping) && <TypingBubble />}

      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-[10px] px-[8px] py-[2px] text-[11px] font-semibold text-white"
        style={{
          top: -20,
          background: `${player.avatarColor || colors.body}cc`,
          boxShadow: `0 2px 6px ${player.avatarColor || colors.body}40`,
          pointerEvents: 'none',
        }}
      >
        <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: '#00D68F' }} />
        {player.name}
      </div>
      <CharacterSVG
        color={player.avatarColor || colors.body}
        skinColor={player.skinColor || '#FFE0BD'}
        hairColor={player.hairColor || colors.hair}
        hairStyle={(player.hairStyle as HairStyle) || 'default'}
        accessory={(player.accessory as Accessory) || 'none'}
        size={CHAR_W}
        direction={resolvedDir}
        animFrame={isMoving ? animFrame : 0}
        idleAnim={isMoving ? 'none' : idleAnim}
      />

      {petType !== 'none' && <CharacterPet type={petType} ownerDirection={resolvedDir} />}
    </div>
  );
}

interface OtherPlayersProps {
  onPlayerRightClick?: (player: OtherPlayer, clientX: number, clientY: number) => void;
}

export default function OtherPlayers({ onPlayerRightClick }: OtherPlayersProps) {
  const otherPlayers = useMetaverseStore((s) => s.otherPlayers);
  const currentRoom = useMetaverseStore((s) => s.currentRoom);
  const playersRef = useRef(otherPlayers);
  const rafRef = useRef(0);
  const prevTsRef = useRef(0);

  useEffect(() => {
    playersRef.current = otherPlayers;
  }, [otherPlayers]);

  // Lerp 루프 (delta-time 보정: fps 변동과 무관하게 일정 속도 유지)
  useEffect(() => {
    const store = useMetaverseStore;

    const loop = (timestamp: number) => {
      const dt = prevTsRef.current ? Math.min(timestamp - prevTsRef.current, 50) : 16.67;
      prevTsRef.current = timestamp;
      // 60fps 기준 정규화 → 30fps에서도 동일한 실제 속도
      const factor = 1 - Math.pow(1 - LERP_SPEED, dt / 16.67);

      const players = playersRef.current;
      let next: Map<string, OtherPlayer> | null = null;

      for (const [id, p] of players) {
        const ddx = p.targetX - p.x;
        const ddy = p.targetY - p.y;
        if (Math.abs(ddx) > 0.5 || Math.abs(ddy) > 0.5) {
          if (!next) next = new Map(players);
          next.set(id, { ...p, x: p.x + ddx * factor, y: p.y + ddy * factor });
        }
      }

      if (next) store.setState({ otherPlayers: next });
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
        <OtherPlayerSprite
          key={p.userId}
          player={p}
          onRightClick={onPlayerRightClick}
        />
      ))}
    </>
  );
}
