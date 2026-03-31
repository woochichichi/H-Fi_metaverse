import { useState } from 'react';
import { X, Trophy, Zap } from 'lucide-react';
import { useReactionGame, type ReactionPhase } from '../../hooks/useReactionGame';
import { useReactionRanking } from '../../hooks/useReactionRanking';

const PHASE_BG: Record<ReactionPhase, string> = {
  idle: '#2563EB',
  waiting: '#EF4444',
  ready: '#22C55E',
  'too-early': '#F97316',
  wrong: '#EF4444',
  result: '#8B5CF6',
};

const MEDAL = ['🥇', '🥈', '🥉'];

function RankingTab() {
  const { ranking, loading } = useReactionRanking();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <span className="text-sm text-text-muted">로딩 중...</span>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Trophy size={32} className="text-text-muted" />
        <p className="text-sm text-text-muted">아직 기록이 없습니다</p>
        <p className="text-xs text-text-muted">게임을 플레이하면 랭킹에 등록됩니다!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
              i < 3 ? 'bg-white/[.06]' : 'bg-white/[.02]'
            }`}
          >
            <span className="w-7 text-center text-sm font-bold">
              {i < 3 ? MEDAL[i] : `${i + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {r.nickname || r.name}
              </p>
              <p className="text-xs text-text-muted">{r.team}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold text-text-primary">
                {r.best_avg_ms}ms
              </p>
              <p className="text-xs font-mono text-text-muted">
                최고 {r.best_single_ms}ms
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TargetGrid({
  phase,
  targetIndex,
  gridSize,
  onTargetClick,
}: {
  phase: ReactionPhase;
  targetIndex: number;
  gridSize: number;
  onTargetClick: (i: number) => void;
}) {
  const cols = Math.round(Math.sqrt(gridSize));

  return (
    <div
      className="grid w-full gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: gridSize }, (_, i) => {
        const isTarget = i === targetIndex;
        let bg = '#374151';
        let scale = '';

        if (phase === 'ready') {
          bg = isTarget ? '#22C55E' : '#EF4444';
          scale = isTarget ? 'animate-pulse' : '';
        }

        return (
          <button
            key={i}
            onClick={() => onTargetClick(i)}
            className={`aspect-square rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${scale}`}
            style={{
              background: bg,
              boxShadow: phase === 'ready' && isTarget ? '0 0 20px #22C55E66' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export default function ReactionPanel({ onClose }: { onClose: () => void }) {
  const {
    phase, round, totalRounds, times, currentTime, bestTime,
    targetIndex, gridSize, startGame, handleTargetClick, handleRetry,
  } = useReactionGame();
  const [tab, setTab] = useState<'game' | 'ranking'>('game');

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 + 탭 */}
      <div className="border-b border-white/[.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-heading text-base font-bold text-text-primary">⚡ 반응속도</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex px-4 gap-1 pb-2">
          {(['game', 'ranking'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? 'bg-accent/20 text-accent'
                  : 'text-text-muted hover:bg-white/[.06] hover:text-text-secondary'
              }`}
            >
              {t === 'game' ? '게임' : <>
                <Trophy size={12} />
                랭킹
              </>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'ranking' ? (
        <RankingTab />
      ) : (
        <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto p-4">
          {/* 시작 전 */}
          {phase === 'idle' && times.length === 0 && (
            <>
              <button
                onClick={startGame}
                className="flex w-full flex-col items-center justify-center rounded-2xl p-8 transition-all duration-200 active:scale-[.97]"
                style={{ background: PHASE_BG.idle, minHeight: 160, boxShadow: '0 4px 24px #2563EB44' }}
              >
                <span className="text-lg font-bold text-white">클릭하여 시작!</span>
                <span className="mt-2 text-sm text-white/70 text-center">
                  초록색 타겟만 빠르게 클릭하세요
                </span>
              </button>
              <div className="rounded-lg bg-white/[.04] p-4 text-xs text-text-muted leading-relaxed">
                <p><span className="text-green-400 font-semibold">초록 타겟</span>만 클릭! <span className="text-red-400 font-semibold">빨간 타겟</span>을 누르면 처음부터</p>
                <p>너무 일찍 클릭해도 처음부터 다시!</p>
                <p>5라운드 평균 반응속도로 랭킹 등록</p>
                <p className="mt-1">🏆 평균 200ms 이하면 프로급!</p>
              </div>
            </>
          )}

          {/* 라운드 진행 중 */}
          {(phase === 'waiting' || phase === 'ready') && (
            <>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Zap size={14} />
                라운드 {round + 1} / {totalRounds}
              </div>
              {phase === 'waiting' && (
                <p className="text-sm font-semibold text-orange-400 animate-pulse">
                  기다리세요... 초록색이 나타나면 클릭!
                </p>
              )}
              <TargetGrid
                phase={phase}
                targetIndex={targetIndex}
                gridSize={gridSize}
                onTargetClick={handleTargetClick}
              />
            </>
          )}

          {/* 라운드 사이 대기 */}
          {phase === 'idle' && times.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg bg-white/[.06] px-4 py-2 text-center">
                <span className="text-lg font-mono font-bold text-green-400">{currentTime}ms</span>
              </div>
              <p className="text-xs text-text-muted">다음 라운드 준비 중...</p>
            </div>
          )}

          {/* 너무 빨리 클릭 → 처음부터 */}
          {phase === 'too-early' && (
            <button
              onClick={handleRetry}
              className="flex w-full flex-col items-center justify-center rounded-2xl p-8 transition-all active:scale-[.97]"
              style={{ background: PHASE_BG['too-early'], minHeight: 160 }}
            >
              <span className="text-3xl">😅</span>
              <span className="mt-2 text-lg font-bold text-white">너무 빨라요!</span>
              <span className="mt-1 text-sm text-white/70">클릭하여 처음부터 다시</span>
            </button>
          )}

          {/* 오답 클릭 → 처음부터 */}
          {phase === 'wrong' && (
            <button
              onClick={handleRetry}
              className="flex w-full flex-col items-center justify-center rounded-2xl p-8 transition-all active:scale-[.97]"
              style={{ background: PHASE_BG.wrong, minHeight: 160 }}
            >
              <span className="text-3xl">❌</span>
              <span className="mt-2 text-lg font-bold text-white">틀렸어요!</span>
              <span className="mt-1 text-sm text-white/70">초록 타겟만 클릭하세요</span>
              <span className="mt-1 text-xs text-white/50">클릭하여 처음부터 다시</span>
            </button>
          )}

          {/* 결과 */}
          {phase === 'result' && (
            <button
              onClick={handleRetry}
              className="flex w-full flex-col items-center justify-center rounded-2xl p-8 transition-all active:scale-[.97]"
              style={{ background: PHASE_BG.result, minHeight: 160, boxShadow: '0 4px 24px #8B5CF644' }}
            >
              <span className="text-4xl font-black text-white">{bestTime}ms</span>
              <span className="mt-1 text-sm text-white/80">평균 반응속도</span>
              <span className="mt-2 text-xs text-white/60">클릭하여 다시 도전</span>
            </button>
          )}

          {/* 라운드별 기록 */}
          {times.length > 0 && (
            <div className="w-full rounded-lg bg-white/[.04] p-3">
              <p className="mb-2 text-xs font-medium text-text-muted">라운드 기록</p>
              <div className="flex flex-wrap gap-2">
                {times.map((t, i) => (
                  <div key={i} className="rounded-md bg-white/[.06] px-3 py-1.5 text-center">
                    <p className="text-[10px] text-text-muted">R{i + 1}</p>
                    <p className="text-sm font-mono font-semibold text-text-primary">{t}ms</p>
                  </div>
                ))}
              </div>
              {times.length > 1 && (
                <p className="mt-2 text-xs text-text-muted text-right">
                  평균: {Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms
                  {' · '}최고: {Math.min(...times)}ms
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
