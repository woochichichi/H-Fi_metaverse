import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export type ReactionPhase = 'idle' | 'waiting' | 'ready' | 'result' | 'too-early' | 'wrong';

const ROUNDS = 5;
const MIN_DELAY = 1500;
const MAX_DELAY = 5000;
const GRID_SIZE = 9; // 3x3 격자

export function useReactionGame() {
  const { profile } = useAuthStore();
  const [phase, setPhase] = useState<ReactionPhase>('idle');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState(0); // 정답 타겟 인덱스
  const readyAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const pickTarget = useCallback(() => {
    setTargetIndex(Math.floor(Math.random() * GRID_SIZE));
  }, []);

  const startRound = useCallback(() => {
    setPhase('waiting');
    setCurrentTime(null);
    pickTarget();
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timerRef.current = setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, [pickTarget]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRound(0);
    setTimes([]);
    setCurrentTime(null);
    setBestTime(null);
    savedRef.current = false;
    startRound();
  }, [startRound]);

  // 정답 타겟 클릭
  const handleTargetClick = useCallback((index: number) => {
    if (phase === 'waiting') {
      // 너무 일찍 클릭 → 처음부터
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('too-early');
      return;
    }

    if (phase !== 'ready') return;

    if (index !== targetIndex) {
      // 오답 → 처음부터
      setPhase('wrong');
      return;
    }

    // 정답
    const elapsed = Math.round(performance.now() - readyAtRef.current);
    setCurrentTime(elapsed);
    const newTimes = [...times, elapsed];
    setTimes(newTimes);

    const nextRound = round + 1;
    if (nextRound >= ROUNDS) {
      const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
      setBestTime(avg);
      setPhase('result');
      if (profile && !savedRef.current) {
        savedRef.current = true;
        const best = Math.min(...newTimes);
        saveReactionResult(profile.id, avg, best).catch(() => {
          savedRef.current = false;
        });
      }
    } else {
      setRound(nextRound);
      setPhase('idle');
      timerRef.current = setTimeout(() => startRound(), 800);
    }
  }, [phase, round, times, targetIndex, startRound, profile]);

  // 실패 화면에서 재시작
  const handleRetry = useCallback(() => {
    startGame();
  }, [startGame]);

  return {
    phase,
    round,
    totalRounds: ROUNDS,
    times,
    currentTime,
    bestTime,
    targetIndex,
    gridSize: GRID_SIZE,
    startGame,
    handleTargetClick,
    handleRetry,
  };
}

export async function saveReactionResult(userId: string, avgMs: number, bestMs: number) {
  const { error } = await supabase
    .from('reaction_records')
    .insert({ user_id: userId, avg_ms: avgMs, best_ms: bestMs });
  if (error) console.error('반응속도 기록 저장 실패:', error.message);
}
