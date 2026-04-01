import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Coffee } from 'lucide-react';
import { useFortune } from '../../hooks/useFortune';
import { useDeviceMode } from '../../hooks/useDeviceMode';

type Phase = 'idle' | 'spinning' | 'done';

// 점수별 리액션 이모지 + 색상
function getScoreTheme(score: number) {
  if (score >= 97) return { emoji: '🔥', glow: '#EF4444', bg: '#EF444420', text: '🎰 JACKPOT!' };
  if (score >= 92) return { emoji: '🎉', glow: '#F97316', bg: '#F9731620', text: '🍀 LUCKY!' };
  if (score >= 88) return { emoji: '✨', glow: '#FBBF24', bg: '#FBBF2420', text: '⭐ NICE!' };
  if (score >= 84) return { emoji: '☕', glow: '#34D399', bg: '#34D39920', text: '👍 GOOD!' };
  return { emoji: '🌿', glow: '#60A5FA', bg: '#60A5FA20', text: '😌 CHILL~' };
}

// 하루 응원 문구 (점수 무관, 랜덤)
const CHEER_MESSAGES = [
  '오늘도 불태워봅시다! 🔥',
  '당신의 하루를 응원합니다! 💪',
  '할 수 있다! 오늘도 파이팅! 🚀',
  '세상에서 제일 멋진 당신, 오늘도 빛나세요! ⭐',
  '퇴근까지 전력질주! 끝까지 달려봅시다! 🏃‍♂️',
  '힘든 하루도 당신이라면 거뜬! 💥',
  '오늘 하루도 최선을 다하는 당신이 멋져요! 👊',
  '점심 지나면 반이야! 화이팅! 🍚',
  '어제보다 더 강한 오늘의 나! 레츠고! 🎯',
  '포기하지 마! 퇴근이 기다리고 있어! 🌅',
];

// 슬롯 릴 1개 — 숫자가 세로로 회전
function SlotReel({ finalDigit, spinning, delay }: { finalDigit: number; spinning: boolean; delay: number }) {
  const reelRef = useRef<HTMLDivElement>(null);
  const [stopped, setStopped] = useState(!spinning);
  const [currentDigit, setCurrentDigit] = useState(finalDigit);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!spinning) {
      setStopped(true);
      setCurrentDigit(finalDigit);
      return;
    }

    setStopped(false);
    // 빠르게 숫자 돌리기
    intervalRef.current = setInterval(() => {
      setCurrentDigit(Math.floor(Math.random() * 10));
    }, 60);

    // delay 후 멈춤
    const stopTimer = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setCurrentDigit(finalDigit);
      setStopped(true);
    }, delay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(stopTimer);
    };
  }, [spinning, finalDigit, delay]);

  return (
    <div
      ref={reelRef}
      className="relative flex items-center justify-center overflow-hidden rounded-lg border-2"
      style={{
        width: 56,
        height: 72,
        borderColor: stopped ? 'rgba(251,191,36,.6)' : 'rgba(255,255,255,.15)',
        background: stopped
          ? 'linear-gradient(180deg, rgba(251,191,36,.08) 0%, rgba(0,0,0,.3) 50%, rgba(251,191,36,.08) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(0,0,0,.3) 50%, rgba(255,255,255,.04) 100%)',
        transition: 'border-color .3s ease, background .3s ease',
        boxShadow: stopped ? '0 0 12px rgba(251,191,36,.2), inset 0 1px 0 rgba(255,255,255,.1)' : 'inset 0 1px 0 rgba(255,255,255,.05)',
      }}
    >
      {/* 상하 그라데이션 마스크 */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,.4) 100%)',
      }} />
      <span
        className="relative z-20 font-heading tabular-nums"
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: stopped ? '#FBBF24' : 'rgba(255,255,255,.6)',
          textShadow: stopped ? '0 0 8px rgba(251,191,36,.5)' : 'none',
          transition: 'color .2s',
        }}
      >
        {currentDigit}
      </span>
    </div>
  );
}

export default function FortunePanel({ onClose }: { onClose: () => void }) {
  const { todayResult, loading, checked, checkToday, drawFortune } = useFortune();
  const [phase, setPhase] = useState<Phase>('idle');
  const [displayScore, setDisplayScore] = useState(80);
  const [spinning, setSpinning] = useState(false);
  const mode = useDeviceMode();
  const isMobile = mode === 'mobile';

  useEffect(() => {
    checkToday();
  }, [checkToday]);

  useEffect(() => {
    if (checked && todayResult) {
      setDisplayScore(todayResult.score);
      setPhase('done');
    }
  }, [checked, todayResult]);

  const handleDraw = useCallback(async () => {
    if (phase !== 'idle' || todayResult) return;

    const result = await drawFortune();
    if (!result) return;

    if (isMobile) {
      setDisplayScore(result.score);
      setPhase('done');
      return;
    }

    // PC: 슬롯머신 릴 애니메이션
    setDisplayScore(result.score);
    setSpinning(true);
    setPhase('spinning');

    // 마지막 릴이 멈추는 시간 후 done 처리
    const longestDelay = result.score === 100 ? 2400 : 2000;
    setTimeout(() => {
      setSpinning(false);
      setPhase('done');
    }, longestDelay + 100);
  }, [phase, todayResult, drawFortune, isMobile]);

  // 점수를 자릿수 배열로 분리 (80~99: [십, 일], 100: [1, 0, 0])
  const digits = String(displayScore).split('').map(Number);
  const theme = getScoreTheme(displayScore);

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
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
        {loading || !checked ? (
          <span className="text-sm text-text-muted">로딩 중...</span>
        ) : phase === 'idle' && !todayResult ? (
          <>
            {/* 대기 화면 — 슬롯머신 외형 */}
            <div className="flex flex-col items-center gap-5">
              {/* 머신 상단 장식 */}
              <div className="text-center">
                <div className="text-4xl mb-1">🎰</div>
                <p className="text-xs text-amber-400/70 font-heading tracking-widest">FORTUNE MACHINE</p>
              </div>

              {/* 빈 릴 미리보기 */}
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center rounded-lg border-2 border-white/[.08]"
                    style={{
                      width: 56, height: 72,
                      background: 'linear-gradient(180deg, rgba(255,255,255,.02) 0%, rgba(0,0,0,.2) 50%, rgba(255,255,255,.02) 100%)',
                    }}
                  >
                    <span className="text-2xl text-white/[.15] font-heading font-black">?</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-sm text-text-secondary">
                커피 한 잔과 함께<br />오늘의 운세를 뽑아보세요!
              </p>
            </div>

            {/* 레버 버튼 */}
            <button
              onClick={handleDraw}
              className="group relative rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                boxShadow: '0 4px 16px rgba(245,158,11,.3), inset 0 1px 0 rgba(255,255,255,.2)',
              }}
            >
              <span className="relative z-10">PULL!</span>
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }} />
            </button>
          </>
        ) : (
          <>
            {/* 슬롯머신 본체 */}
            <div className="flex flex-col items-center gap-4">
              {/* 머신 상단 */}
              {phase === 'done' && (
                <div className="text-center animate-[fadeIn_.4s_ease]">
                  <span className="text-2xl">{theme.emoji}</span>
                  <p
                    className="text-sm font-heading font-black tracking-wider mt-1"
                    style={{ color: theme.glow, textShadow: `0 0 10px ${theme.glow}40` }}
                  >
                    {theme.text}
                  </p>
                </div>
              )}

              {/* 릴 영역 — 슬롯머신 프레임 */}
              <div
                className="relative rounded-2xl border-2 p-4"
                style={{
                  borderColor: phase === 'done' ? `${theme.glow}50` : 'rgba(255,255,255,.08)',
                  background: phase === 'done'
                    ? `linear-gradient(180deg, ${theme.bg}, rgba(0,0,0,.2))`
                    : 'rgba(0,0,0,.2)',
                  boxShadow: phase === 'done'
                    ? `0 0 24px ${theme.glow}15, inset 0 1px 0 rgba(255,255,255,.06)`
                    : 'inset 0 1px 0 rgba(255,255,255,.04)',
                  transition: 'all .5s ease',
                }}
              >
                {/* 점수 표시선 (가운데 수평선) */}
                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] rounded-full z-30 pointer-events-none"
                  style={{
                    background: phase === 'done'
                      ? `linear-gradient(90deg, transparent, ${theme.glow}60, transparent)`
                      : 'linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent)',
                  }}
                />

                {/* 릴 */}
                <div className="flex gap-2">
                  {digits.map((d, i) => (
                    <SlotReel
                      key={i}
                      finalDigit={d}
                      spinning={spinning}
                      delay={800 + i * 600}
                    />
                  ))}
                </div>
              </div>

              {/* 점수 텍스트 */}
              {phase === 'done' && (
                <p
                  className="text-lg font-heading font-black animate-[fadeIn_.5s_ease]"
                  style={{ color: theme.glow, textShadow: `0 0 6px ${theme.glow}30` }}
                >
                  {displayScore}점
                </p>
              )}
            </div>

            {/* 운세 메시지 + 응원 문구 */}
            {phase === 'done' && todayResult && (
              <div className="max-w-xs text-center animate-[fadeIn_.6s_ease]">
                <p className="text-sm leading-relaxed text-text-primary">{todayResult.message}</p>
                <div className="mt-3 rounded-lg px-4 py-2" style={{ background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)' }}>
                  <p className="text-xs font-bold text-amber-400/90">
                    {CHEER_MESSAGES[todayResult.score % CHEER_MESSAGES.length]}
                  </p>
                </div>
                <p className="mt-2 text-[11px] text-text-muted">{todayResult.fortune_date}</p>
              </div>
            )}

            {phase === 'spinning' && (
              <p className="text-xs text-amber-400/70 animate-pulse font-heading tracking-wider">
                SPINNING...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
