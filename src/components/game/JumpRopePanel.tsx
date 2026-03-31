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
        <p>줄 속도가 점점 빨라집니다 (15초마다 가속)</p>
        <p>팀별 평균 생존시간으로 순위를 겨룹니다</p>
      </div>
    </div>
  );
}

// ─── 3D 게임 캔버스 (줄 앞/뒤 레이어 분리) ───
function GameCanvas({ players, ropeAngle, phase, onTap }: {
  players: JumpRopePlayer[]; ropeAngle: number; phase: string; onTap: () => void;
}) {
  const W = 400, H = 260, groundY = 195, jumpH = 60;
  const alive = players.filter((p) => p.isAlive);
  const dead = players.filter((p) => !p.isAlive);

  const cosA = Math.cos(ropeAngle);
  const ropeBaseY = groundY - 55;
  const ropeCY = ropeBaseY - cosA * 62;
  const isFront = cosA < 0; // 줄이 캐릭터 앞(아래)으로 내려올 때
  const dangerDist = Math.abs(ropeAngle - Math.PI);
  const nearBottom = dangerDist < 0.5;
  const ropeColor = nearBottom ? '#EF4444' : '#F8B500';
  // 앞에 올 때 두껍고 선명, 뒤에 갈 때 얇고 흐릿
  const thick = isFront ? 3.5 + Math.abs(cosA) * 2 : 1.5;
  const sag = isFront ? 14 + Math.abs(cosA) * 14 : 8;
  const danger01 = Math.max(0, 1 - dangerDist / 1.2);
  const gW = W - 60;

  const ropePath = `M 39 ${ropeCY} Q ${W / 2} ${ropeCY + sag} ${W - 39} ${ropeCY}`;

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: H, background: '#1a1a2e' }} onClick={onTap}>
      {/* Layer 1: 바닥 + 기둥 + 뒤쪽 줄 */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <polygon points={`0,${groundY} ${W},${groundY} ${W - 15},${H} 15,${H}`} fill="#2d5a3e" />
        <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#4ade80" strokeWidth="1.5" opacity="0.25" />
        {[1, 2, 3].map((i) => (
          <line key={i} x1={i * 5} y1={groundY + i * 14} x2={W - i * 5} y2={groundY + i * 14} stroke="#4ade80" strokeWidth="0.5" opacity={0.08} />
        ))}
        <rect x="35" y={groundY - 85} width="8" height="85" rx="2" fill="#8B7355" />
        <rect x={W - 43} y={groundY - 85} width="8" height="85" rx="2" fill="#8B7355" />
        <circle cx="39" cy={groundY - 85} r="4" fill="#A0895C" />
        <circle cx={W - 39} cy={groundY - 85} r="4" fill="#A0895C" />
        {phase === 'playing' && !isFront && (
          <path d={ropePath} stroke={ropeColor} strokeWidth={thick} fill="none" strokeLinecap="round"
            opacity="0.3" strokeDasharray="6 4" />
        )}
      </svg>

      {/* Layer 2: 캐릭터 */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {alive.map((p, i) => {
          const x = W / 2 + (i - (alive.length - 1) / 2) * 40;
          return (
            <div key={p.id} className="absolute" style={{ left: x - 14, bottom: (H - groundY) + p.jumpY * jumpH }}>
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

      {/* Layer 3: 앞쪽 줄 + 경고 + 게이지 */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}>
        {phase === 'playing' && <>
          <ellipse cx={W / 2} cy={groundY - 1} rx={90 - cosA * 35} ry={3} fill="#EF4444" opacity={Math.max(0, -cosA * 0.4)} />
          {isFront && (
            <path d={ropePath} stroke={ropeColor} strokeWidth={thick} fill="none" strokeLinecap="round"
              style={{ filter: nearBottom ? 'drop-shadow(0 0 8px #EF4444)' : 'none' }} />
          )}
          {dangerDist < 0.7 && (
            <text x={W / 2} y="24" textAnchor="middle" fontSize="15" fontWeight="900"
              fill="#EF4444" opacity={Math.min(1, (0.7 - dangerDist) * 2.5)}>JUMP!</text>
          )}
          <rect x={30} y={H - 20} width={gW} height={8} rx={4} fill="#ffffff10" />
          <rect x={30} y={H - 20} width={gW * danger01} height={8} rx={4}
            fill={danger01 > 0.7 ? '#EF4444' : danger01 > 0.3 ? '#F59E0B' : '#22C55E'} />
        </>}
      </svg>
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
            <JumpRopeResult players={game.players} survivalMs={game.survivalMs} jumpCount={game.jumpCount} currentSpeed={game.currentSpeed} onReset={game.resetAll} />
          )}
        </div>
      )}
    </div>
  );
}
