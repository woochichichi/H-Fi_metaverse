import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export type JumpRopePhase = 'idle' | 'countdown' | 'playing' | 'gameover';

const INITIAL_SPEED = 1.6;        // 초당 회전수 (rps)
const SPEED_INCREMENT = 0.12;     // 10초마다 속도 증가
const JUMP_DURATION = 420;        // 점프 지속시간 (ms)
const DANGER_ZONE = 0.28;        // rope 바닥 판정 각도 범위 (rad)

export interface JumpRopeState {
  phase: JumpRopePhase;
  ropeAngle: number;          // 0 ~ 2π
  playerY: number;            // 0 = 바닥, 1 = 최대높이
  jumpCount: number;
  survivalMs: number;
  currentSpeed: number;
  countdown: number;
  bestRecord: number | null;
}

export function useJumpRopeGame() {
  const { profile } = useAuthStore();
  const [phase, setPhase] = useState<JumpRopePhase>('idle');
  const [ropeAngle, setRopeAngle] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const [jumpCount, setJumpCount] = useState(0);
  const [survivalMs, setSurvivalMs] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_SPEED);
  const [countdown, setCountdown] = useState(3);

  const animRef = useRef(0);
  const lastFrameRef = useRef(0);
  const startTimeRef = useRef(0);
  const jumpStartRef = useRef<number | null>(null);
  const jumpCountRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const angleRef = useRef(0);
  const phaseRef = useRef<JumpRopePhase>('idle');
  const savedRef = useRef(false);
  const wasInDangerRef = useRef(false);

  const cleanup = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const gameLoop = useCallback((now: number) => {
    if (phaseRef.current !== 'playing') return;

    const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
    lastFrameRef.current = now;

    const elapsed = now - startTimeRef.current;

    // 속도 증가: 10초마다
    speedRef.current = INITIAL_SPEED + Math.floor(elapsed / 10000) * SPEED_INCREMENT;
    setCurrentSpeed(speedRef.current);

    // 줄 회전 (angle 0~2π)
    angleRef.current = (angleRef.current + dt * speedRef.current * Math.PI * 2) % (Math.PI * 2);
    setRopeAngle(angleRef.current);

    // 점프 상태 계산
    let py = 0;
    if (jumpStartRef.current !== null) {
      const jumpElapsed = now - jumpStartRef.current;
      if (jumpElapsed >= JUMP_DURATION) {
        jumpStartRef.current = null;
        py = 0;
      } else {
        const t = jumpElapsed / JUMP_DURATION;
        py = Math.sin(Math.PI * t); // 0→1→0 부드러운 포물선
      }
    }
    setPlayerY(py);

    // 줄 위치: angle ≈ π 일 때 바닥 (아래쪽 통과)
    const ropeBottom = Math.abs(angleRef.current - Math.PI) < DANGER_ZONE;

    // 줄이 바닥에 있고 플레이어가 점프하지 않으면 → 게임오버
    if (ropeBottom && py < 0.25) {
      // 줄이 바닥에 진입한 순간에만 체크 (연속 프레임 중복 방지)
      if (!wasInDangerRef.current) {
        phaseRef.current = 'gameover';
        setPhase('gameover');
        setSurvivalMs(Math.round(elapsed));
        saveRecord(Math.round(elapsed), jumpCountRef.current, speedRef.current);
        return;
      }
    }

    // 줄이 바닥을 지나가고 플레이어가 뛰어있으면 → 성공 카운트
    if (ropeBottom && py >= 0.25 && !wasInDangerRef.current) {
      jumpCountRef.current += 1;
      setJumpCount(jumpCountRef.current);
    }

    wasInDangerRef.current = ropeBottom;
    setSurvivalMs(Math.round(elapsed));

    animRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const saveRecord = useCallback(async (duration: number, jumps: number, maxSpd: number) => {
    if (!profile || savedRef.current) return;
    savedRef.current = true;
    const { error } = await supabase
      .from('jump_rope_records')
      .insert({ user_id: profile.id, duration_ms: duration, jump_count: jumps, max_speed: maxSpd });
    if (error) {
      console.error('줄넘기 기록 저장 실패:', error.message);
      savedRef.current = false;
    }
  }, [profile]);

  const startGame = useCallback(() => {
    cleanup();
    savedRef.current = false;
    jumpCountRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    angleRef.current = 0;
    jumpStartRef.current = null;
    wasInDangerRef.current = false;

    setJumpCount(0);
    setSurvivalMs(0);
    setCurrentSpeed(INITIAL_SPEED);
    setRopeAngle(0);
    setPlayerY(0);
    setCountdown(3);
    setPhase('countdown');
    phaseRef.current = 'countdown';

    // 카운트다운: 3 → 2 → 1 → 시작
    let cnt = 3;
    const tick = () => {
      cnt -= 1;
      if (cnt <= 0) {
        phaseRef.current = 'playing';
        setPhase('playing');
        startTimeRef.current = performance.now();
        lastFrameRef.current = performance.now();
        animRef.current = requestAnimationFrame(gameLoop);
      } else {
        setCountdown(cnt);
        setTimeout(tick, 800);
      }
    };
    setTimeout(tick, 800);
  }, [cleanup, gameLoop]);

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    if (jumpStartRef.current !== null) return; // 이미 점프 중
    jumpStartRef.current = performance.now();
  }, []);

  // 키보드 이벤트
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (phaseRef.current === 'idle' || phaseRef.current === 'gameover') {
          startGame();
        } else {
          jump();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startGame, jump]);

  return {
    phase, ropeAngle, playerY, jumpCount,
    survivalMs, currentSpeed, countdown,
    startGame, jump,
  };
}

export function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const frac = Math.floor((ms % 1000) / 100);
  return `${sec}.${frac}초`;
}
