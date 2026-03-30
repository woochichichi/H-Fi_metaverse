import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export type ReactionPhase = 'idle' | 'waiting' | 'ready' | 'result' | 'too-early';

const ROUNDS = 5;
const MIN_DELAY = 1500;
const MAX_DELAY = 5000;

export function useReactionGame() {
  const { profile } = useAuthStore();
  const [phase, setPhase] = useState<ReactionPhase>('idle');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const readyAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startRound = useCallback(() => {
    setPhase('waiting');
    setCurrentTime(null);
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timerRef.current = setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, []);

  const startGame = useCallback(() => {
    setRound(0);
    setTimes([]);
    setCurrentTime(null);
    setBestTime(null);
    savedRef.current = false;
    startRound();
  }, [startRound]);

  const handleClick = useCallback(() => {
    if (phase === 'idle') return;

    if (phase === 'waiting') {
      // 너무 일찍 클릭
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('too-early');
      return;
    }

    if (phase === 'too-early') {
      // 다시 시도
      startRound();
      return;
    }

    if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - readyAtRef.current);
      setCurrentTime(elapsed);
      const newTimes = [...times, elapsed];
      setTimes(newTimes);

      const nextRound = round + 1;
      if (nextRound >= ROUNDS) {
        // 게임 끝
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        setBestTime(avg);
        setPhase('result');
        // 결과 저장
        if (profile && !savedRef.current) {
          savedRef.current = true;
          const best = Math.min(...newTimes);
          saveReactionResult(profile.id, avg, best);
        }
      } else {
        setRound(nextRound);
        setPhase('idle');
        // 다음 라운드 자동 시작
        setTimeout(() => startRound(), 800);
      }
      return;
    }

    if (phase === 'result') {
      startGame();
    }
  }, [phase, round, times, startRound, startGame, profile]);

  return {
    phase,
    round,
    totalRounds: ROUNDS,
    times,
    currentTime,
    bestTime,
    startGame,
    handleClick,
  };
}

export async function saveReactionResult(userId: string, avgMs: number, bestMs: number) {
  const { error } = await supabase
    .from('reaction_records')
    .insert({ user_id: userId, avg_ms: avgMs, best_ms: bestMs });
  if (error) console.error('반응속도 기록 저장 실패:', error.message);
}
