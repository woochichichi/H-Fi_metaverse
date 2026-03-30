import { useState } from 'react';
import { X, Trophy, Zap } from 'lucide-react';
import { useReactionGame, type ReactionPhase } from '../../hooks/useReactionGame';
import { useReactionRanking } from '../../hooks/useReactionRanking';

const PHASE_CONFIG: Record<ReactionPhase, { bg: string; text: string; sub: string }> = {
  idle: { bg: '#2563EB', text: '클릭하여 시작!', sub: '화면이 초록색으로 바뀌면 최대한 빨리 클릭하세요' },
  waiting: { bg: '#EF4444', text: '기다리세요...', sub: '아직 클릭하지 마세요!' },
  ready: { bg: '#22C55E', text: '지금 클릭!', sub: '' },
  'too-early': { bg: '#F97316', text: '너무 빨라요! 😅', sub: '클릭하여 다시 시도' },
  result: { bg: '#8B5CF6', text: '결과', sub: '클릭하여 다시 도전' },
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

export default function ReactionPanel({ onClose }: { onClose: () => void }) {
  const { phase, round, totalRounds, times, currentTime, bestTime, startGame, handleClick } = useReactionGame();
  const [tab, setTab] = useState<'game' | 'ranking'>('game');

  const config = PHASE_CONFIG[phase];

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
          {/* 라운드 표시 */}
          {phase !== 'idle' && phase !== 'result' && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Zap size={14} />
              라운드 {round + 1} / {totalRounds}
            </div>
          )}

          {/* 메인 클릭 영역 */}
          <button
            onClick={phase === 'idle' ? startGame : handleClick}
            className="flex w-full flex-col items-center justify-center rounded-2xl p-8 transition-all duration-200 active:scale-[.97]"
            style={{
              background: config.bg,
              minHeight: 200,
              cursor: 'pointer',
              boxShadow: `0 4px 24px ${config.bg}44`,
            }}
          >
            {phase === 'ready' ? (
              <span className="text-5xl font-black text-white">클릭!</span>
            ) : phase === 'result' ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl font-black text-white">{bestTime}ms</span>
                <span className="text-sm text-white/80">평균 반응속도</span>
              </div>
            ) : phase === 'too-early' ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">😅</span>
                <span className="text-lg font-bold text-white">{config.text}</span>
                <span className="text-sm text-white/70">{config.sub}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-bold text-white">{config.text}</span>
                {config.sub && <span className="text-sm text-white/70 text-center">{config.sub}</span>}
              </div>
            )}
          </button>

          {/* 현재 라운드 결과 */}
          {currentTime && phase !== 'result' && (
            <div className="rounded-lg bg-white/[.06] px-4 py-2 text-center">
              <span className="text-lg font-mono font-bold text-green-400">{currentTime}ms</span>
            </div>
          )}

          {/* 라운드별 기록 */}
          {times.length > 0 && (
            <div className="w-full rounded-lg bg-white/[.04] p-3">
              <p className="mb-2 text-xs font-medium text-text-muted">라운드 기록</p>
              <div className="flex flex-wrap gap-2">
                {times.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-white/[.06] px-3 py-1.5 text-center"
                  >
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

          {/* 게임 설명 */}
          {phase === 'idle' && times.length === 0 && (
            <div className="rounded-lg bg-white/[.04] p-4 text-xs text-text-muted leading-relaxed">
              <p>화면이 <span className="text-green-400 font-semibold">초록색</span>으로 바뀌면 최대한 빨리 클릭!</p>
              <p>5라운드 평균 반응속도로 랭킹에 등록됩니다.</p>
              <p className="mt-1">🏆 평균 200ms 이하면 프로급!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
