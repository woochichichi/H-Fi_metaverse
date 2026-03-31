import { useState } from 'react';
import { X, Trophy, Users } from 'lucide-react';
import { useJumpRopeGame, formatDuration, type JumpRopePlayer } from '../../hooks/useJumpRopeGame';
import JumpRopeRankingTab from './JumpRopeRanking';
import CharacterSVG from '../metaverse/CharacterSVG';
import type { HairStyle, Accessory } from '../../lib/constants';

const Char = ({ p, size = 28 }: { p: JumpRopePlayer; size?: number }) => (
  <CharacterSVG color={p.avatarColor || '#6C5CE7'} skinColor={p.skinColor} hairColor={p.hairColor}
    hairStyle={(p.hairStyle as HairStyle) || 'default'} accessory={(p.accessory as Accessory) || 'none'} size={size} />
);

// ─── 로비 화면 ───
function Lobby({ players, canStart, onStart }: { players: JumpRopePlayer[]; canStart: boolean; onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Users size={16} />
        <span>대기실 ({players.length}명)</span>
      </div>

      <div className="w-full space-y-2">
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg bg-white/[.06] px-3 py-2.5">
            <Char p={p} />
            <span className="flex-1 text-sm font-medium text-text-primary truncate">{p.name}</span>
            <span className="text-xs text-text-muted">{p.team}</span>
          </div>
        ))}
      </div>

      {players.length < 2 && (
        <p className="text-xs text-text-muted animate-pulse">최소 2명이 필요합니다 — 다른 플레이어를 기다리는 중...</p>
      )}

      <button
        onClick={onStart}
        disabled={!canStart}
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed bg-accent/90 hover:bg-accent"
      >
        {canStart ? `게임 시작 (${players.length}명)` : '대기 중...'}
      </button>

      <div className="w-full rounded-lg bg-white/[.04] p-4 text-xs text-text-muted leading-relaxed space-y-1">
        <p><span className="font-semibold text-accent">스페이스바</span> 또는 화면 터치로 점프!</p>
        <p>줄 속도가 점점 빨라집니다 (15초마다 가속)</p>
        <p>팀별 평균 생존시간으로 순위를 겨룹니다</p>
      </div>
    </div>
  );
}

// ─── 게임 캔버스 (다중 캐릭터) ───
function GameCanvas({ players, ropeAngle, phase, onTap }: {
  players: JumpRopePlayer[]; ropeAngle: number; phase: string; onTap: () => void;
}) {
  const W = 380, H = 200, groundY = 170, jumpH = 50;
  const alive = players.filter((p) => p.isAlive);
  const dead = players.filter((p) => !p.isAlive);
  const ropeP = Math.sin(ropeAngle);
  const ropeCY = groundY - 45 - ropeP * 50;
  const ropeSag = 16 + Math.abs(ropeP) * 8;
  const nearBottom = Math.abs(ropeAngle - Math.PI) < 0.4;
  const ropeColor = nearBottom ? '#EF4444' : '#F8B500';

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: H, background: '#1a1a2e' }} onClick={onTap}>
      {/* 바닥 + 줄 SVG */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
        <rect x="0" y={groundY} width={W} height={H - groundY} fill="#2d5a3e" />
        <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#4ade80" strokeWidth="1.5" opacity="0.3" />
        <rect x="30" y={groundY - 70} width="6" height="70" rx="2" fill="#8B7355" />
        <rect x={W - 36} y={groundY - 70} width="6" height="70" rx="2" fill="#8B7355" />
        {phase === 'playing' && (
          <path
            d={`M 33 ${ropeCY} Q ${W / 2} ${ropeCY + ropeSag} ${W - 33} ${ropeCY}`}
            stroke={ropeColor} strokeWidth="2.5" fill="none" strokeLinecap="round"
            style={{ filter: nearBottom ? 'drop-shadow(0 0 3px #EF4444)' : 'none' }}
          />
        )}
      </svg>

      {/* 캐릭터들 */}
      {alive.map((p, i) => {
        const x = W / 2 + (i - (alive.length - 1) / 2) * 36;
        return (
          <div key={p.id} className="absolute transition-none" style={{
            left: x - 14, bottom: (H - groundY) + p.jumpY * jumpH,
          }}>
            <Char p={p} />
            <p className="text-[8px] text-center text-white/70 mt-[-2px] truncate w-8">{p.name}</p>
          </div>
        );
      })}

      {/* 탈락 캐릭터 (바닥 옆에 앉아있음) */}
      {dead.map((p, i) => (
        <div key={p.id} className="absolute opacity-40" style={{ left: 10 + i * 28, bottom: H - groundY }}>
          <Char p={p} size={22} />
        </div>
      ))}
    </div>
  );
}

// ─── 게임오버 결과 ───
function GameOverView({ players, survivalMs, jumpCount, currentSpeed, onReset }: {
  players: JumpRopePlayer[]; survivalMs: number; jumpCount: number; currentSpeed: number; onReset: () => void;
}) {
  const sorted = [...players].sort((a, b) => b.survivalMs - a.survivalMs);
  const MEDAL = ['🥇', '🥈', '🥉'];
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
            <Char p={p} size={22} />
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

export default function JumpRopePanel({ onClose }: { onClose: () => void }) {
  const game = useJumpRopeGame();
  const [tab, setTab] = useState<'game' | 'ranking'>('game');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-heading text-base font-bold text-text-primary">🪢 단체 줄넘기</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-white/[.08] hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        <div className="flex px-4 gap-1 pb-2">
          {(['game', 'ranking'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/[.06]'}`}>
              {t === 'game' ? '게임' : <><Trophy size={12} /> 랭킹</>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'ranking' ? <JumpRopeRankingTab /> : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {game.phase === 'lobby' && <Lobby players={game.players} canStart={game.canStart} onStart={game.startGame} />}

          {(game.phase === 'playing' || game.phase === 'countdown') && (
            <>
              {game.phase === 'playing' && (
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>⏱ {formatDuration(game.survivalMs)}</span>
                  <span>🔄 x{game.currentSpeed.toFixed(1)}</span>
                  <span>{game.players.filter((p) => p.isAlive).length}/{game.players.length}명 생존</span>
                </div>
              )}
              <GameCanvas players={game.players} ropeAngle={game.ropeAngle} phase={game.phase} onTap={game.jump} />
              {game.phase === 'countdown' && (
                <div className="text-4xl font-black text-accent animate-pulse text-center -mt-28 mb-16">{game.countdown}</div>
              )}
              {game.phase === 'playing' && !game.myAlive && (
                <p className="text-xs text-red-400 text-center">탈락! 다른 플레이어를 응원하세요</p>
              )}
              {game.phase === 'playing' && game.myAlive && (
                <p className="text-xs text-text-muted animate-pulse text-center">스페이스바 또는 화면 터치로 점프!</p>
              )}
            </>
          )}

          {game.phase === 'gameover' && (
            <GameOverView players={game.players} survivalMs={game.survivalMs} jumpCount={game.jumpCount} currentSpeed={game.currentSpeed} onReset={game.resetAll} />
          )}
        </div>
      )}
    </div>
  );
}
