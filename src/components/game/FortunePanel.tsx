import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Coffee } from 'lucide-react';
import { useFortune } from '../../hooks/useFortune';
import { useDeviceMode } from '../../hooks/useDeviceMode';

type Phase = 'idle' | 'spinning' | 'done';

const SCORE_LABEL: { min: number; max: number; label: string; color: string }[] = [
  { min: 80, max: 83, label: '평길', color: '#60A5FA' },
  { min: 84, max: 87, label: '소길', color: '#34D399' },
  { min: 88, max: 91, label: '중길', color: '#FBBF24' },
  { min: 92, max: 96, label: '길', color: '#F97316' },
  { min: 97, max: 100, label: '대길', color: '#EF4444' },
];

function getLabel(score: number) {
  return SCORE_LABEL.find((s) => score >= s.min && score <= s.max) ?? SCORE_LABEL[0];
}

export default function FortunePanel({ onClose }: { onClose: () => void }) {
  const { todayResult, loading, checked, checkToday, drawFortune } = useFortune();
  const [phase, setPhase] = useState<Phase>('idle');
  const [displayScore, setDisplayScore] = useState(80);
  const spinTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mode = useDeviceMode();
  const isMobile = mode === 'mobile';

  useEffect(() => {
    checkToday();
  }, [checkToday]);

  // 이미 오늘 뽑은 결과가 있으면 바로 표시
  useEffect(() => {
    if (checked && todayResult) {
      setDisplayScore(todayResult.score);
      setPhase('done');
    }
  }, [checked, todayResult]);

  const cleanup = useCallback(() => {
    if (spinTimerRef.current) {
      clearInterval(spinTimerRef.current);
      spinTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleDraw = useCallback(async () => {
    if (phase !== 'idle' || todayResult) return;

    const result = await drawFortune();
    if (!result) return;

    if (isMobile) {
      // 모바일: 애니메이션 없이 바로 표시
      setDisplayScore(result.score);
      setPhase('done');
      return;
    }

    // PC: 슬롯머신 애니메이션
    setPhase('spinning');
    let tick = 0;
    const totalTicks = 30; // ~1.5초
    spinTimerRef.current = setInterval(() => {
      tick++;
      setDisplayScore(Math.floor(Math.random() * 21) + 80);
      if (tick >= totalTicks) {
        cleanup();
        setDisplayScore(result.score);
        setPhase('done');
      }
    }, 50);
  }, [phase, todayResult, drawFortune, isMobile, cleanup]);

  const label = getLabel(displayScore);

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="border-b border-white/[.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Coffee size={16} className="text-amber-400" />
            <h2 className="font-heading text-base font-bold text-text-primary">바나프레소</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:bg-white/[.06] hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
        <p className="px-4 pb-3 text-xs text-text-muted">오늘의 운세를 확인해보세요 (하루 1회)</p>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {loading || !checked ? (
          <span className="text-sm text-text-muted">로딩 중...</span>
        ) : phase === 'idle' && !todayResult ? (
          <>
            {/* 뽑기 전 대기 화면 */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl">☕</div>
              <p className="text-center text-sm text-text-secondary">
                커피 한 잔과 함께<br />오늘의 운세를 확인해보세요
              </p>
            </div>
            <button
              onClick={handleDraw}
              className="rounded-xl bg-amber-500/90 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-500 hover:shadow-amber-500/20 active:scale-95"
            >
              오늘의 운세 뽑기
            </button>
          </>
        ) : (
          <>
            {/* 슬롯머신 점수 표시 */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-2xl border-2 shadow-xl"
                style={{
                  borderColor: phase === 'done' ? label.color : 'rgba(255,255,255,.1)',
                  background: phase === 'done'
                    ? `${label.color}15`
                    : 'rgba(255,255,255,.03)',
                  transition: 'all .4s ease',
                }}
              >
                <span
                  className="font-heading text-4xl font-black tabular-nums"
                  style={{
                    color: phase === 'done' ? label.color : 'rgba(255,255,255,.5)',
                    transition: 'color .4s ease',
                  }}
                >
                  {displayScore}
                </span>
                {phase === 'spinning' && (
                  <div className="absolute inset-0 rounded-2xl animate-pulse bg-white/[.03]" />
                )}
              </div>

              {/* 등급 라벨 */}
              {phase === 'done' && (
                <span
                  className="rounded-full px-4 py-1 text-sm font-bold animate-[fadeIn_.4s_ease]"
                  style={{
                    background: `${label.color}20`,
                    color: label.color,
                  }}
                >
                  {label.label}
                </span>
              )}
            </div>

            {/* 운세 메시지 */}
            {phase === 'done' && todayResult && (
              <div className="max-w-xs text-center animate-[fadeIn_.6s_ease]">
                <p className="text-sm leading-relaxed text-text-primary">
                  {todayResult.message}
                </p>
                <p className="mt-3 text-[11px] text-text-muted">
                  {todayResult.fortune_date} 운세
                </p>
              </div>
            )}

            {phase === 'spinning' && (
              <p className="text-xs text-text-muted animate-pulse">운세를 뽑는 중...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
