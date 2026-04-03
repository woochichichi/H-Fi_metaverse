import { useEffect, useRef, useCallback, useState } from 'react';
import CharacterSVG, { type IdleAnim } from './CharacterSVG';
import CharacterPet from './CharacterPet';
import SpawnEffect from './SpawnEffect';
import TypingBubble from './TypingBubble';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';
import { ROOMS_DATA, TEAM_TO_ROOM, type HairStyle, type Accessory, type PetType } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';

const SPEED = 4;
const CHAR_W = 34;
const CHAR_H = 46;
const IDLE_TIMEOUT = 5000;
const WALK_FRAME_INTERVAL = 150;
const IDLE_ANIM_INTERVAL = 3000;

const IDLE_ANIMS: IdleAnim[] = ['tilt', 'sleep', 'stretch', 'dance'];

export default function PlayerCharacter() {
  const { playerPosition, setPlayerPosition, setNearZone, nearZone, nearPortal, moveTarget, setMoveTarget, currentRoom, setNearPortal, enterRoom, setPlayerDirection, playerDirection, isTyping, spawnKey } = useMetaverseStore();
  const { modalOpen, openModal } = useUiStore();
  const { profile } = useAuthStore();
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const posRef = useRef(playerPosition);
  const prevTsRef = useRef(0);
  const spawnedRef = useRef(false);

  // 걷기 애니메이션
  const [animFrame, setAnimFrame] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const isMovingRef = useRef(false);

  // idle 애니메이션
  const [idleAnim, setIdleAnim] = useState<IdleAnim>('none');
  const lastMoveTimeRef = useRef(Date.now());
  const directionRef = useRef(playerDirection);
  const idleAnimRef = useRef<IdleAnim>('none');

  // 팀 기반 스폰
  useEffect(() => {
    if (spawnedRef.current) return;
    const team = profile?.team;
    if (team) {
      enterRoom(TEAM_TO_ROOM[team] || 'stock');
    }
    spawnedRef.current = true;
  }, [profile?.team, enterRoom]);

  // 키 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keysRef.current.add(e.key);
      if (e.key === ' ') {
        e.preventDefault();
        if (nearZone) openModal(nearZone);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [modalOpen, nearZone, openModal]);

  // 포탈 근처 → 자동 이동
  useEffect(() => {
    if (modalOpen || !nearPortal) return;
    enterRoom(nearPortal.targetRoom, nearPortal.spawnPoint);
  }, [nearPortal, modalOpen, enterRoom]);

  // Zone + Portal 체크
  const checkZoneAndPortal = useCallback((px: number, py: number) => {
    const room = ROOMS_DATA[currentRoom];
    const cx = px + CHAR_W / 2;
    const cy = py + CHAR_H / 2;

    let foundZone: string | null = null;
    for (const z of room.zones) {
      if (cx > z.x && cx < z.x + z.width && cy > z.y && cy < z.y + z.height) {
        foundZone = z.id;
        break;
      }
    }
    setNearZone(foundZone);

    let foundPortal = null;
    for (const p of room.portals) {
      if (cx > p.x && cx < p.x + p.w && cy > p.y && cy < p.y + p.h) {
        foundPortal = p;
        break;
      }
    }
    setNearPortal(foundPortal);
  }, [currentRoom, setNearZone, setNearPortal]);

  const moveTargetRef = useRef(moveTarget);
  useEffect(() => { moveTargetRef.current = moveTarget; }, [moveTarget]);

  // 키보드 입력 시 자동이동 취소
  useEffect(() => {
    const cancelAutoMove = () => {
      if (moveTargetRef.current) setMoveTarget(null);
    };
    window.addEventListener('keydown', cancelAutoMove);
    return () => window.removeEventListener('keydown', cancelAutoMove);
  }, [setMoveTarget]);

  // 걷기 프레임 토글
  useEffect(() => {
    if (!isMoving) { setAnimFrame(0); return; }
    const timer = setInterval(() => {
      setAnimFrame((f) => (f === 1 ? 2 : 1));
    }, WALK_FRAME_INTERVAL);
    return () => clearInterval(timer);
  }, [isMoving]);

  // idle 감지 + 모션 순환
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastMoveTimeRef.current >= IDLE_TIMEOUT && !isMovingRef.current) {
        setIdleAnim((prev) => {
          const next = IDLE_ANIMS[(IDLE_ANIMS.indexOf(prev) + 1) % IDLE_ANIMS.length];
          idleAnimRef.current = next;
          return next;
        });
      }
    }, IDLE_ANIM_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // 게임루프
  useEffect(() => {
    const AUTO_SPEED_PPS = 5 * 60; // 300 px/s (delta-time 보정용)
    const SPEED_PPS = SPEED * 60;  // 240 px/s
    const ARRIVE_DIST = 6;
    let moving = false;

    const loop = (timestamp: number) => {
      // delta-time 보정: 프레임률과 무관하게 일정 속도 유지
      const dt = prevTsRef.current ? Math.min(timestamp - prevTsRef.current, 50) : 16.67;
      prevTsRef.current = timestamp;
      const spd = SPEED_PPS * dt / 1000;
      const autoSpd = AUTO_SPEED_PPS * dt / 1000;

      if (!modalOpen) {
        const room = ROOMS_DATA[currentRoom];
        const mapW = room.mapSize.w;
        const mapH = room.mapSize.h;
        const target = moveTargetRef.current;

        if (target) {
          const diffX = target.x - posRef.current.x;
          const diffY = target.y - posRef.current.y;
          const dist = Math.sqrt(diffX * diffX + diffY * diffY);
          if (dist < ARRIVE_DIST) {
            checkZoneAndPortal(posRef.current.x, posRef.current.y);
            setMoveTarget(null);
            if (target.zoneId) openModal(target.zoneId);
            moving = false;
          } else {
            const nx = Math.max(20, Math.min(mapW - 40, posRef.current.x + (diffX / dist) * autoSpd));
            const ny = Math.max(20, Math.min(mapH - 40, posRef.current.y + (diffY / dist) * autoSpd));
            posRef.current = { x: nx, y: ny };
            setPlayerPosition(posRef.current);
            checkZoneAndPortal(nx, ny);
            if (Math.abs(diffX) > 1) {
              const newDir = diffX > 0 ? 'right' : 'left';
              if (directionRef.current !== newDir) {
                directionRef.current = newDir;
                setPlayerDirection(newDir);
              }
            }
            moving = true;
            lastMoveTimeRef.current = Date.now();
            if (idleAnimRef.current !== 'none') {
              idleAnimRef.current = 'none';
              setIdleAnim('none');
            }
          }
        } else {
          const keys = keysRef.current;
          let dx = 0, dy = 0;
          if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy = -spd;
          if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy = spd;
          if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx = -spd;
          if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx = spd;
          if (dx || dy) {
            const nx = Math.max(20, Math.min(mapW - 40, posRef.current.x + dx));
            const ny = Math.max(20, Math.min(mapH - 40, posRef.current.y + dy));
            posRef.current = { x: nx, y: ny };
            setPlayerPosition(posRef.current);
            checkZoneAndPortal(nx, ny);
            if (dx !== 0) {
              const newDir = dx > 0 ? 'right' : 'left';
              if (directionRef.current !== newDir) {
                directionRef.current = newDir;
                setPlayerDirection(newDir);
              }
            }
            moving = true;
            lastMoveTimeRef.current = Date.now();
            if (idleAnimRef.current !== 'none') {
              idleAnimRef.current = 'none';
              setIdleAnim('none');
            }
          } else {
            moving = false;
          }
        }
      } else {
        moving = false;
      }

      if (moving !== isMovingRef.current) {
        isMovingRef.current = moving;
        setIsMoving(moving);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [modalOpen, currentRoom, setPlayerPosition, checkZoneAndPortal, setMoveTarget, openModal, setPlayerDirection]);

  // posRef sync
  useEffect(() => {
    posRef.current = playerPosition;
  }, [playerPosition]);

  const displayName = profile?.nickname || profile?.name || 'You';

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${playerPosition.x}px, ${playerPosition.y}px)`,
        willChange: 'transform',
        filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.25))',
      }}
    >
      <SpawnEffect key={spawnKey} />
      {isTyping && <TypingBubble />}

      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-[10px] px-[10px] py-[2px] text-[10px] font-semibold text-white"
        style={{
          top: -22,
          background: `${profile?.avatar_color ?? '#6C5CE7'}e6`,
          boxShadow: `0 2px 8px ${profile?.avatar_color ?? '#6C5CE7'}4d`,
        }}
      >
        <span className="inline-block h-[6px] w-[6px] rounded-full bg-success" />
        {displayName}
      </div>

      <CharacterSVG
        color={profile?.avatar_color ?? '#6C5CE7'}
        skinColor={profile?.skin_color ?? '#FFE0BD'}
        hairColor={profile?.hair_color ?? '#5a3e28'}
        hairStyle={(profile?.hair_style as HairStyle) ?? 'default'}
        accessory={(profile?.accessory as Accessory) ?? 'none'}
        size={CHAR_W}
        direction={playerDirection}
        animFrame={isMoving ? animFrame : 0}
        idleAnim={isMoving ? 'none' : idleAnim}
      />

      {((profile?.pet as PetType) ?? 'none') !== 'none' && (
        <CharacterPet type={(profile?.pet as PetType)} ownerDirection={playerDirection} />
      )}
    </div>
  );
}
