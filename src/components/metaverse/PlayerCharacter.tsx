import { useEffect, useRef, useCallback } from 'react';
import CharacterSVG from './CharacterSVG';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';
import { ROOMS_DATA, TEAM_TO_ROOM } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';

const SPEED = 4;
const CHAR_W = 34;
const CHAR_H = 46;

export default function PlayerCharacter() {
  const { playerPosition, setPlayerPosition, setNearZone, nearZone, moveTarget, setMoveTarget, currentRoom, setNearPortal, enterRoom } = useMetaverseStore();
  const { modalOpen, openModal } = useUiStore();
  const { profile } = useAuthStore();
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const posRef = useRef(playerPosition);
  const spawnedRef = useRef(false);

  // 팀 기반 스폰 → 해당 룸으로 진입
  useEffect(() => {
    if (spawnedRef.current) return;
    const team = profile?.team;
    if (team) {
      const roomId = TEAM_TO_ROOM[team] || 'stock';
      enterRoom(roomId);
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
        const portal = useMetaverseStore.getState().nearPortal;
        if (portal) {
          enterRoom(portal.targetRoom, portal.spawnPoint);
        } else if (nearZone) {
          openModal(nearZone);
        }
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
  }, [modalOpen, nearZone, openModal, enterRoom]);

  // Zone + Portal 체크
  const checkZoneAndPortal = useCallback((px: number, py: number) => {
    const room = ROOMS_DATA[currentRoom];
    const cx = px + CHAR_W / 2;
    const cy = py + CHAR_H / 2;

    // Zone 체크
    let foundZone: string | null = null;
    for (const z of room.zones) {
      if (cx > z.x && cx < z.x + z.width && cy > z.y && cy < z.y + z.height) {
        foundZone = z.id;
        break;
      }
    }
    setNearZone(foundZone);

    // Portal 체크
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

  // 게임루프
  useEffect(() => {
    const AUTO_SPEED = 5;
    const ARRIVE_DIST = 6;
    const loop = () => {
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
            openModal(target.zoneId);
          } else {
            const nx = Math.max(20, Math.min(mapW - 40, posRef.current.x + (diffX / dist) * AUTO_SPEED));
            const ny = Math.max(20, Math.min(mapH - 40, posRef.current.y + (diffY / dist) * AUTO_SPEED));
            posRef.current = { x: nx, y: ny };
            setPlayerPosition(posRef.current);
            checkZoneAndPortal(nx, ny);
          }
        } else {
          const keys = keysRef.current;
          let dx = 0, dy = 0;
          if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy = -SPEED;
          if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy = SPEED;
          if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx = -SPEED;
          if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx = SPEED;
          if (dx || dy) {
            const nx = Math.max(20, Math.min(mapW - 40, posRef.current.x + dx));
            const ny = Math.max(20, Math.min(mapH - 40, posRef.current.y + dy));
            posRef.current = { x: nx, y: ny };
            setPlayerPosition(posRef.current);
            checkZoneAndPortal(nx, ny);
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [modalOpen, currentRoom, setPlayerPosition, checkZoneAndPortal, setMoveTarget, openModal]);

  // posRef sync
  useEffect(() => {
    posRef.current = playerPosition;
  }, [playerPosition]);

  const displayName = profile?.nickname || profile?.name || 'You';

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: playerPosition.x,
        top: playerPosition.y,
        filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.25))',
      }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-[10px] px-[10px] py-[2px] text-[10px] font-semibold text-white"
        style={{
          top: -22,
          background: 'rgba(108,92,231,.9)',
          boxShadow: '0 2px 8px rgba(108,92,231,.3)',
        }}
      >
        <span className="inline-block h-[6px] w-[6px] rounded-full bg-success" />
        {displayName}
      </div>
      <CharacterSVG color="#6C5CE7" skinColor="#FFE0BD" hairColor="#5a3e28" size={CHAR_W} />
    </div>
  );
}
