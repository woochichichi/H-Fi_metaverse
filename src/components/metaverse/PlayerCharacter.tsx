import { useEffect, useRef, useCallback } from 'react';
import CharacterSVG from './CharacterSVG';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';
import { ZONES, MAP_WIDTH, MAP_HEIGHT } from '../../lib/constants';
import type { ZoneId } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';

const SPEED = 4;
const CHAR_W = 34;
const CHAR_H = 46;

export default function PlayerCharacter() {
  const { playerPosition, setPlayerPosition, setNearZone, nearZone } = useMetaverseStore();
  const { modalOpen, openModal } = useUiStore();
  const { profile } = useAuthStore();
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const posRef = useRef(playerPosition);

  // 키 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) return;
      keysRef.current.add(e.key);
      if (e.key === ' ' || e.key === 'Enter') {
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

  // Zone 체크
  const checkZone = useCallback((px: number, py: number) => {
    const cx = px + CHAR_W / 2;
    const cy = py + CHAR_H / 2;
    let found: ZoneId | null = null;
    for (const z of ZONES) {
      if (cx > z.x && cx < z.x + z.width && cy > z.y && cy < z.y + z.height) {
        found = z.id;
        break;
      }
    }
    setNearZone(found);
  }, [setNearZone]);

  // 게임루프
  useEffect(() => {
    const loop = () => {
      if (!modalOpen) {
        const keys = keysRef.current;
        let dx = 0, dy = 0;
        if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy = -SPEED;
        if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy = SPEED;
        if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx = -SPEED;
        if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx = SPEED;
        if (dx || dy) {
          const nx = Math.max(20, Math.min(MAP_WIDTH - 40, posRef.current.x + dx));
          const ny = Math.max(20, Math.min(MAP_HEIGHT - 40, posRef.current.y + dy));
          posRef.current = { x: nx, y: ny };
          setPlayerPosition(posRef.current);
          checkZone(nx, ny);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [modalOpen, setPlayerPosition, checkZone]);

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
      {/* 기분 이모지 */}
      {profile?.mood_emoji && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-sm"
          style={{ top: -36, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.3))' }}
        >
          {profile.mood_emoji}
        </div>
      )}
      {/* 이름표 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-[10px] px-[10px] py-[2px] text-[10px] font-semibold text-white"
        style={{
          top: profile?.mood_emoji ? -18 : -22,
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
