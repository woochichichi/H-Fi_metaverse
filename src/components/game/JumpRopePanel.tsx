import { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { useJumpRopeGame, formatDuration } from '../../hooks/useJumpRopeGame';
import { useJumpRopeRanking } from '../../hooks/useJumpRopeRanking';
import { TEAM_COLORS, TEAMS } from '../../lib/constants';

const MEDAL = ['🥇', '🥈', '🥉'];

function RankingTab() {
  const { ranking, loading } = useJumpRopeRanking();

  if (loading) return <div className="flex flex-1 items-center justify-center p-6"><span className="text-sm text-text-muted">로딩 중...</span></div>;

  if (ranking.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Trophy size={32} className="text-text-muted" />
        <p className="text-sm text-text-muted">아직 기록이 없습니다</p>
        <p className="text-xs text-text-muted">게임을 플레이하면 랭킹에 등록됩니다!</p>
      </div>
    );
  }

  // 팀별 평균 계산
  const teamStats = TEAMS.map((team) => {
    const members = ranking.filter((r) => r.team === team);
    if (members.length === 0) return null;
    const avg = Math.round(members.reduce((s, m) => s + m.best_duration_ms, 0) / members.length);
    return { team, avg, count: members.length };
  }).filter(Boolean).sort((a, b) => b!.avg - a!.avg);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* 팀 랭킹 */}
      {teamStats.length > 1 && (
        <div className="rounded-lg bg-white/[.04] p-3">
          <p className="mb-2 text-xs font-medium text-text-muted">팀 순위 (평균 생존시간)</p>
          <div className="space-y-1.5">
            {teamStats.map((t, i) => (
              <div key={t!.team} className="flex items-center gap-2 rounded-md bg-white/[.06] px-3 py-2">
                <span className="w-6 text-center text-sm font-bold">{i < 3 ? MEDAL[i] : `${i + 1}`}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: TEAM_COLORS[t!.team]?.body }} />
                <span className="flex-1 text-sm font-medium text-text-primary">{t!.team}</span>
                <span className="text-sm font-mono font-semibold text-text-primary">{formatDuration(t!.avg)}</span>
                <span className="text-xs text-text-muted">{t!.count}명</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 개인 랭킹 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-muted px-1">개인 순위</p>
        {ranking.map((r, i) => (
          <div key={r.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${i < 3 ? 'bg-white/[.06]' : 'bg-white/[.02]'}`}>
            <span className="w-7 text-center text-sm font-bold">{i < 3 ? MEDAL[i] : `${i + 1}`}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{r.nickname || r.name}</p>
              <p className="text-xs text-text-muted">{r.team}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold text-text-primary">{formatDuration(r.best_duration_ms)}</p>
              <p className="text-xs font-mono text-text-muted">{r.best_jump_count}회</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG 게임 화면 ───
function GameCanvas({ ropeAngle, playerY, phase }: { ropeAngle: number; playerY: number; phase: string }) {
  const W = 360, H = 220;
  const groundY = 185;
  const charX = W / 2;
  const charBaseY = groundY;
  const jumpHeight = 55;
  const charY = charBaseY - playerY * jumpHeight;

  // 줄 위치: sin으로 높이 계산 (angle=π일 때 바닥)
  const ropeProgress = Math.sin(ropeAngle);  // -1(바닥) ~ 1(위)
  const ropeCenterY = groundY - 50 - ropeProgress * 55;
  const ropeSag = 18 + Math.abs(ropeProgress) * 8;

  // 줄 색상: 바닥 근처면 빨간색
  const isNearBottom = Math.abs(ropeAngle - Math.PI) < 0.4;
  const ropeColor = isNearBottom ? '#EF4444' : '#F8B500';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl" style={{ background: '#1a1a2e' }}>
      {/* 바닥 */}
      <rect x="0" y={groundY} width={W} height={H - groundY} fill="#2d5a3e" rx="0" />
      <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#4ade80" strokeWidth="2" opacity="0.3" />

      {/* 줄 홀더 (양쪽 기둥) */}
      <rect x="40" y={groundY - 80} width="8" height="80" rx="3" fill="#8B7355" />
      <rect x={W - 48} y={groundY - 80} width="8" height="80" rx="3" fill="#8B7355" />

      {/* 줄 */}
      {phase === 'playing' && (
        <path
          d={`M 44 ${ropeCenterY} Q ${charX} ${ropeCenterY + ropeSag} ${W - 44} ${ropeCenterY}`}
          stroke={ropeColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          style={{ filter: isNearBottom ? 'drop-shadow(0 0 4px #EF4444)' : 'none' }}
        />
      )}

      {/* 캐릭터 */}
      <g transform={`translate(${charX}, ${charY})`}>
        {/* 몸 */}
        <rect x="-10" y="-38" width="20" height="24" rx="4" fill="#6C5CE7" />
        {/* 머리 */}
        <circle cx="0" cy="-46" r="10" fill="#FFE0BD" />
        {/* 눈 */}
        <circle cx="-3" cy="-47" r="1.5" fill="#333" />
        <circle cx="3" cy="-47" r="1.5" fill="#333" />
        {/* 입 — 점프 중이면 😆 */}
        {playerY > 0.3 ? (
          <ellipse cx="0" cy="-42" rx="3" ry="2" fill="#333" />
        ) : (
          <line x1="-2" y1="-42" x2="2" y2="-42" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        )}
        {/* 다리 */}
        <rect x="-8" y="-14" width="6" height="14" rx="2" fill="#444" />
        <rect x="2" y="-14" width="6" height="14" rx="2" fill="#444" />
        {/* 점프 이펙트 */}
        {playerY > 0.1 && (
          <>
            <line x1="-8" y1="2" x2="-14" y2="8" stroke="#fff" strokeWidth="1" opacity="0.4" />
            <line x1="0" y1="3" x2="0" y2="10" stroke="#fff" strokeWidth="1" opacity="0.4" />
            <line x1="8" y1="2" x2="14" y2="8" stroke="#fff" strokeWidth="1" opacity="0.4" />
          </>
        )}
      </g>

      {/* 그림자 */}
      <ellipse cx={charX} cy={groundY - 2} rx={12 - playerY * 4} ry={3 - playerY} fill="rgba(0,0,0,0.3)" />
    </svg>
  );
}

export default function JumpRopePanel({ onClose }: { onClose: () => void }) {
  const { phase, ropeAngle, playerY, jumpCount, survivalMs, currentSpeed, countdown, startGame, jump } = useJumpRopeGame();
  const [tab, setTab] = useState<'game' | 'ranking'>('game');

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 + 탭 */}
      <div className="border-b border-white/[.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-heading text-base font-bold text-text-primary">🪢 단체 줄넘기</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        <div className="flex px-4 gap-1 pb-2">
          {(['game', 'ranking'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/[.06] hover:text-text-secondary'}`}>
              {t === 'game' ? '게임' : <><Trophy size={12} /> 랭킹</>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'ranking' ? (
        <RankingTab />
      ) : (
        <div className="flex flex-1 flex-col items-center gap-3 overflow-y-auto p-4">
          {/* 상태 표시 */}
          {phase === 'playing' && (
            <div className="flex w-full items-center justify-between text-xs text-text-secondary">
              <span>⏱ {formatDuration(survivalMs)}</span>
              <span>🔄 x{currentSpeed.toFixed(1)}</span>
              <span>🦘 {jumpCount}회</span>
            </div>
          )}

          {/* 게임 캔버스 */}
          <div className="w-full" onClick={phase === 'playing' ? jump : undefined}>
            <GameCanvas ropeAngle={ropeAngle} playerY={playerY} phase={phase} />
          </div>

          {/* 카운트다운 오버레이 */}
          {phase === 'countdown' && (
            <div className="text-4xl font-black text-accent animate-pulse -mt-32 mb-20">
              {countdown}
            </div>
          )}

          {/* 게임오버 결과 */}
          {phase === 'gameover' && (
            <div className="w-full rounded-xl bg-white/[.06] p-4 text-center space-y-2">
              <p className="text-lg font-bold text-red-400">게임 오버!</p>
              <div className="flex justify-center gap-6">
                <div>
                  <p className="text-2xl font-mono font-black text-text-primary">{formatDuration(survivalMs)}</p>
                  <p className="text-xs text-text-muted">생존 시간</p>
                </div>
                <div>
                  <p className="text-2xl font-mono font-black text-text-primary">{jumpCount}</p>
                  <p className="text-xs text-text-muted">점프 횟수</p>
                </div>
              </div>
              <p className="text-xs text-text-muted">최종 속도 x{currentSpeed.toFixed(1)}</p>
            </div>
          )}

          {/* 시작/재시작 버튼 */}
          {(phase === 'idle' || phase === 'gameover') && (
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-accent/90 py-3 text-sm font-bold text-white transition-all hover:bg-accent active:scale-[.97]"
            >
              {phase === 'idle' ? '게임 시작' : '다시 도전'}
            </button>
          )}

          {/* 조작 안내 */}
          {phase === 'playing' && (
            <p className="text-xs text-text-muted animate-pulse">스페이스바 또는 화면 터치로 점프!</p>
          )}

          {/* 게임 설명 */}
          {phase === 'idle' && (
            <div className="w-full rounded-lg bg-white/[.04] p-4 text-xs text-text-muted leading-relaxed space-y-1">
              <p><span className="font-semibold text-accent">스페이스바</span>를 눌러 줄넘기를 뛰어넘으세요!</p>
              <p>줄 속도가 점점 빨라집니다 (10초마다 가속)</p>
              <p>팀별 평균 생존시간으로 순위를 겨룹니다</p>
              <p className="mt-1">🏆 30초 이상 버티면 프로급!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
