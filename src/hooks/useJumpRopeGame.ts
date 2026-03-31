import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export type JumpRopePhase = 'lobby' | 'countdown' | 'playing' | 'gameover';

export interface JumpRopePlayer {
  id: string;
  name: string;
  team: string;
  avatarColor?: string;
  skinColor?: string;
  hairColor?: string;
  hairStyle?: string;
  accessory?: string;
  isAlive: boolean;
  survivalMs: number;
  jumpCount: number;
  jumpY: number;
}

// ─── 난이도 설정 (쉽게) ───
const INITIAL_SPEED = 0.9;        // 초당 회전수 (느리게 시작)
const SPEED_INCREMENT = 0.06;     // 15초마다 속도 증가
const SPEED_INTERVAL = 15000;     // 가속 주기
const JUMP_DURATION = 520;        // 점프 지속시간 (넉넉)
const DANGER_ZONE = 0.32;         // 줄 바닥 판정 범위

export function useJumpRopeGame() {
  const { profile, user } = useAuthStore();
  const [phase, setPhase] = useState<JumpRopePhase>('lobby');
  const [players, setPlayers] = useState<JumpRopePlayer[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [ropeAngle, setRopeAngle] = useState(0);
  const [survivalMs, setSurvivalMs] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_SPEED);
  const [myAlive, setMyAlive] = useState(true);
  const [jumpCount, setJumpCount] = useState(0);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const animRef = useRef(0);
  const lastFrameRef = useRef(0);
  const startTimeRef = useRef(0);
  const jumpStartRef = useRef<number | null>(null);
  const jumpCountRef = useRef(0);
  const angleRef = useRef(0);
  const phaseRef = useRef<JumpRopePhase>('lobby');
  const myAliveRef = useRef(true);
  const wasInDangerRef = useRef(false);
  const savedRef = useRef(false);
  const otherJumpsRef = useRef<Map<string, number>>(new Map());
  const playersRef = useRef<JumpRopePlayer[]>([]);

  const myId = user?.id ?? '';

  // ─── 플레이어 목록 업데이트 ───
  const updatePlayers = useCallback((updater: (prev: JumpRopePlayer[]) => JumpRopePlayer[]) => {
    setPlayers((prev) => {
      const next = updater(prev);
      playersRef.current = next;
      return next;
    });
  }, []);

  // ─── Supabase Realtime 채널 ───
  useEffect(() => {
    if (!profile || !user) return;

    const channel = supabase.channel('jumprope-game', {
      config: { presence: { key: user.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: JumpRopePlayer[] = Object.values(state)
        .flat()
        .filter((u: any) => u.user_id)
        .map((u: any) => {
          // 기존 상태 유지 (게임 중일 때)
          const existing = playersRef.current.find((p) => p.id === u.user_id);
          return {
            id: u.user_id as string,
            name: (u.name as string) ?? '???',
            team: (u.team as string) ?? '',
            avatarColor: u.avatarColor as string | undefined,
            skinColor: u.skinColor as string | undefined,
            hairColor: u.hairColor as string | undefined,
            hairStyle: u.hairStyle as string | undefined,
            accessory: u.accessory as string | undefined,
            isAlive: existing?.isAlive ?? true,
            survivalMs: existing?.survivalMs ?? 0,
            jumpCount: existing?.jumpCount ?? 0,
            jumpY: existing?.jumpY ?? 0,
          };
        });
      updatePlayers(() => users);
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      // 게임 중 이탈 → 탈락 처리
      if (phaseRef.current === 'playing') {
        const leftIds = new Set(leftPresences.map((p: any) => p.user_id));
        updatePlayers((prev) => prev.map((p) =>
          leftIds.has(p.id) ? { ...p, isAlive: false } : p,
        ));
      }
    });

    // ─── 게임 이벤트 수신 ───
    channel.on('broadcast', { event: 'start' }, () => {
      if (phaseRef.current !== 'lobby') return;
      beginCountdown();
    });

    channel.on('broadcast', { event: 'jump' }, ({ payload }) => {
      if (payload.userId !== myId) {
        otherJumpsRef.current.set(payload.userId, performance.now());
      }
    });

    channel.on('broadcast', { event: 'eliminated' }, ({ payload }) => {
      if (payload.userId !== myId) {
        updatePlayers((prev) => prev.map((p) =>
          p.id === payload.userId
            ? { ...p, isAlive: false, survivalMs: payload.survivalMs, jumpCount: payload.jumpCount }
            : p,
        ));
      }
    });

    channel.on('broadcast', { event: 'reset' }, () => {
      resetToLobby();
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          name: profile.nickname || profile.name,
          team: profile.team,
          avatarColor: profile.avatar_color,
          skinColor: profile.skin_color,
          hairColor: profile.hair_color,
          hairStyle: profile.hair_style,
          accessory: profile.accessory,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // ─── 게임 루프 ───
  const gameLoop = useCallback((now: number) => {
    if (phaseRef.current !== 'playing') return;

    const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
    lastFrameRef.current = now;
    const elapsed = now - startTimeRef.current;

    const speed = INITIAL_SPEED + Math.floor(elapsed / SPEED_INTERVAL) * SPEED_INCREMENT;
    setCurrentSpeed(speed);

    angleRef.current = (angleRef.current + dt * speed * Math.PI * 2) % (Math.PI * 2);
    setRopeAngle(angleRef.current);

    // 내 점프 상태
    let py = 0;
    if (jumpStartRef.current !== null) {
      const je = now - jumpStartRef.current;
      if (je >= JUMP_DURATION) { jumpStartRef.current = null; }
      else { py = Math.sin(Math.PI * je / JUMP_DURATION); }
    }

    // 다른 플레이어 점프 상태 계산
    updatePlayers((prev) => prev.map((p) => {
      if (p.id === myId) return { ...p, jumpY: py };
      const js = otherJumpsRef.current.get(p.id);
      if (!js) return { ...p, jumpY: 0 };
      const je = now - js;
      if (je >= JUMP_DURATION) { otherJumpsRef.current.delete(p.id); return { ...p, jumpY: 0 }; }
      return { ...p, jumpY: Math.sin(Math.PI * je / JUMP_DURATION) };
    }));

    // 충돌 판정 (내 캐릭터만)
    if (myAliveRef.current) {
      const ropeBottom = Math.abs(angleRef.current - Math.PI) < DANGER_ZONE;
      if (ropeBottom && py < 0.25 && !wasInDangerRef.current) {
        myAliveRef.current = false;
        setMyAlive(false);
        const ms = Math.round(elapsed);
        setSurvivalMs(ms);
        updatePlayers((prev) => prev.map((p) =>
          p.id === myId ? { ...p, isAlive: false, survivalMs: ms, jumpCount: jumpCountRef.current } : p,
        ));
        channelRef.current?.send({ type: 'broadcast', event: 'eliminated', payload: { userId: myId, survivalMs: ms, jumpCount: jumpCountRef.current } });
        saveRecord(ms, jumpCountRef.current, speed);

        // 모든 플레이어 탈락 체크
        const allDead = playersRef.current.every((p) => !p.isAlive || p.id === myId);
        if (allDead) {
          phaseRef.current = 'gameover';
          setPhase('gameover');
          return;
        }
      }
      if (ropeBottom && py >= 0.25 && !wasInDangerRef.current) {
        jumpCountRef.current += 1;
        setJumpCount(jumpCountRef.current);
      }
      wasInDangerRef.current = ropeBottom;
    } else {
      // 이미 탈락 — 다른 사람 전원 탈락 체크
      const alive = playersRef.current.filter((p) => p.isAlive);
      if (alive.length === 0) {
        phaseRef.current = 'gameover';
        setPhase('gameover');
        return;
      }
    }

    setSurvivalMs(Math.round(elapsed));
    animRef.current = requestAnimationFrame(gameLoop);
  }, [myId, updatePlayers]);

  // ─── 카운트다운 시작 ───
  const beginCountdown = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    savedRef.current = false;
    jumpCountRef.current = 0;
    angleRef.current = 0;
    jumpStartRef.current = null;
    wasInDangerRef.current = false;
    myAliveRef.current = true;
    otherJumpsRef.current.clear();

    setMyAlive(true);
    setJumpCount(0);
    setSurvivalMs(0);
    setCurrentSpeed(INITIAL_SPEED);
    setRopeAngle(0);
    setCountdown(3);
    setPhase('countdown');
    phaseRef.current = 'countdown';

    updatePlayers((prev) => prev.map((p) => ({ ...p, isAlive: true, survivalMs: 0, jumpCount: 0, jumpY: 0 })));

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
  }, [gameLoop, updatePlayers]);

  // ─── 게임 시작 (방장이 호출) ───
  const startGame = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'start', payload: {} });
    beginCountdown();
  }, [beginCountdown]);

  // ─── 로비로 리셋 ───
  const resetToLobby = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    phaseRef.current = 'lobby';
    setPhase('lobby');
    setMyAlive(true);
    myAliveRef.current = true;
    setSurvivalMs(0);
    setJumpCount(0);
    setRopeAngle(0);
    updatePlayers((prev) => prev.map((p) => ({ ...p, isAlive: true, survivalMs: 0, jumpCount: 0, jumpY: 0 })));
  }, [updatePlayers]);

  const resetAll = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'reset', payload: {} });
    resetToLobby();
  }, [resetToLobby]);

  // ─── 점프 ───
  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing' || !myAliveRef.current) return;
    if (jumpStartRef.current !== null) return;
    jumpStartRef.current = performance.now();
    channelRef.current?.send({ type: 'broadcast', event: 'jump', payload: { userId: myId } });
  }, [myId]);

  // ─── DB 저장 ───
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

  // ─── 키보드 ───
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      e.preventDefault();
      jump();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump]);

  const canStart = players.length >= 2 && phase === 'lobby';

  return {
    phase, players, countdown, ropeAngle, survivalMs, currentSpeed,
    myAlive, jumpCount, canStart,
    startGame, jump, resetAll,
  };
}

export function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const frac = Math.floor((ms % 1000) / 100);
  return `${sec}.${frac}초`;
}
