import { formatDuration, type JumpRopePlayer } from '../../hooks/useJumpRopeGame';
import CharacterSVG from '../metaverse/CharacterSVG';
import type { HairStyle, Accessory } from '../../lib/constants';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function JumpRopeResult({ players, survivalMs, jumpCount, currentSpeed, onReset }: {
  players: JumpRopePlayer[]; survivalMs: number; jumpCount: number; currentSpeed: number; onReset: () => void;
}) {
  const sorted = [...players].sort((a, b) => b.survivalMs - a.survivalMs);
  return (
    <div className="space-y-3">
      <div className="w-full rounded-xl bg-white/[.06] p-4 text-center space-y-2">
        <p className="text-lg font-bold text-red-400">게임 종료!</p>
        <div className="flex justify-center gap-6">
          <div>
            <p className="text-xl font-mono font-black text-text-primary">{formatDuration(survivalMs)}</p>
            <p className="text-xs text-text-muted">내 생존시간</p>
          </div>
          <div>
            <p className="text-xl font-mono font-black text-text-primary">{jumpCount}</p>
            <p className="text-xs text-text-muted">점프</p>
          </div>
        </div>
        <p className="text-xs text-text-muted">최종 속도 x{currentSpeed.toFixed(1)}</p>
      </div>
      <div className="rounded-lg bg-white/[.04] p-3 space-y-1.5">
        {sorted.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-center font-bold">{i < 3 ? MEDAL[i] : `${i + 1}`}</span>
            <CharacterSVG color={p.avatarColor || '#6C5CE7'} skinColor={p.skinColor} hairColor={p.hairColor}
              hairStyle={(p.hairStyle as HairStyle) || 'default'} accessory={(p.accessory as Accessory) || 'none'} size={22} />
            <span className="flex-1 truncate text-text-primary">{p.name}</span>
            <span className="font-mono text-text-secondary">{formatDuration(p.survivalMs)}</span>
          </div>
        ))}
      </div>
      <button onClick={onReset} className="w-full rounded-xl bg-accent/90 py-3 text-sm font-bold text-white hover:bg-accent active:scale-[.97]">
        다시 도전
      </button>
    </div>
  );
}
