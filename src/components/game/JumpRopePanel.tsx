import { useState } from 'react';
import { X, Trophy, Users } from 'lucide-react';
import { useJumpRopeGame, formatDuration, type JumpRopePlayer } from '../../hooks/useJumpRopeGame';
import JumpRopeRankingTab from './JumpRopeRanking';
import JumpRopeResult from './JumpRopeResult';
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
        <p>줄 속도가 점점 빨라집니다 (10초마다 가속)</p>
        <p className="text-danger/80 font-medium">한 명이라도 걸리면 전원 게임오버!</p>
      </div>
    </div>
  );
}

// ─── 2D 사이드뷰 게임 캔버스 ───
function GameCanvas({ players, ropeAngle, phase, onTap }: {
  players: JumpRopePlayer[]; ropeAngle: number; phase: string; onTap: () => void;
}) {
  const W = 400, H = 240, groundY = 185, jumpH = 60;
  const alive = players.filter((p) => p.isAlive);
  const dead = players.filter((p) => !p.isAlive);

  // 줄 높이: sinA로 단순 사이드뷰 (0=위, π=바닥)
  const sinA = Math.sin(ropeAngle);
  const ropeY = groundY - 70 + sinA * 65; // 위(115) ↔ 바닥(185)
  const dangerDist = Math.abs(ropeAngle - Math.PI);
  const nearBottom = dangerDist < 0.5;
  const ropeColor = nearBottom ? '#EF4444' : '#F8B500';
  const thick = nearBottom ? 4 : 2.5;
  const danger01 = Math.max(0, 1 - dangerDist / 1.2);
  const gW = W - 60;

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: H, background: '#1a1a2e' }} onClick={onTap}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
        {/* 바닥 */}
        <rect x="0" y={groundY} width={W} height={H - groundY} fill="#2d5a3e" />
        <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#4ade80" strokeWidth="1.5" opacity="0.3" />

        {/* 기둥 */}
        <rect x="32" y={groundY - 90} width="6" height="90" rx="2" fill="#8B7355" />
        <rect x={W - 38} y={groundY - 90} width="6" height="90" rx="2" fill="#8B7355" />
        <circle cx="35" cy={groundY - 90} r="3.5" fill="#A0895C" />
        <circle cx={W - 35} cy={groundY - 90} r="3.5" fill="#A0895C" />

        {/* 줄 */}
        {phase === 'playing' && (
          <path
            d={`M 35 ${ropeY} Q ${W / 2} ${ropeY + 12} ${W - 35} ${ropeY}`}
            stroke={ropeColor} strokeWidth={thick} fill="none" strokeLinecap="round"
            style={{ filter: nearBottom ? 'drop-shadow(0 0 6px #EF4444)' : 'none' }}
          />
        )}

        {/* JUMP 경고 */}
        {phase === 'playing' && dangerDist < 0.7 && (
          <text x={W / 2} y="28" textAnchor="middle" fontSize="16" fontWeight="900"
            fill="#EF4444" opacity={Math.min(1, (0.7 - dangerDist) * 2.5)}>JUMP!</text>
        )}

        {/* 하단 위험 게이지 */}
        {phase === 'playing' && <>
          <rect x={30} y={H - 18} width={gW} height={7} rx={3.5} fill="#ffffff10" />
          <rect x={30} y={H - 18} width={gW * danger01} height={7} rx={3.5}
            fill={danger01 > 0.7 ? '#EF4444' : danger01 > 0.3 ? '#F59E0B' : '#22C55E'} />
        </>}
      </svg>

      {/* 캐릭터 */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {alive.map((p, i) => {
          const x = W / 2 + (i - (alive.length - 1) / 2) * 40;
          return (
            <div key={p.id} className="absolute transition-transform" style={{ left: x - 14, bottom: (H - groundY) + p.jumpY * jumpH }}>
              <Char p={p} />
              <p className="text-[8px] text-center text-white/70 truncate w-8">{p.name}</p>
            </div>
          );
        })}
        {dead.map((p, i) => (
          <div key={p.id} className="absolute opacity-30" style={{ left: 8 + i * 28, bottom: H - groundY }}>
            <Char p={p} size={22} />
          </div>
        ))}
      </div>
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
          <h2 className="font-heading text-base font-bold text-text-primary">🏃 단체 줄넘기</h2>
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
                <p className="text-xs text-red-400 text-center">줄에 걸렸습니다!</p>
              )}
              {game.phase === 'playing' && game.myAlive && (
                <p className="text-xs text-text-muted animate-pulse text-center">스페이스바 또는 화면 터치로 점프!</p>
              )}
            </>
          )}

          {game.phase === 'gameover' && (
            <JumpRopeResult players={game.players} survivalMs={game.survivalMs} jumpCount={game.jumpCount} currentSpeed={game.currentSpeed} onReset={game.resetAll} />
          )}
        </div>
      )}
    </div>
  );
}
