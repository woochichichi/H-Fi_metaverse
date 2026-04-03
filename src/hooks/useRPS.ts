import { useEffect, useRef, useCallback, useState } from 'react';
import { subscribeRPS, sendRPSEvent } from './usePlayerSync';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSGameState = 'idle' | 'requested' | 'countdown' | 'choosing' | 'result';

export interface RPSOpponent {
  userId: string;
  name: string;
}

export interface RPSState {
  gameState: RPSGameState;
  opponent: RPSOpponent | null;
  myChoice: RPSChoice | null;
  opponentChoice: RPSChoice | null;
  countdown: number;
  iAmChallenger: boolean; // true = 내가 요청한 쪽
  incomingRequest: RPSOpponent | null; // 수락 대기 중인 요청
}

const COUNTDOWN_SEC = 5;
const CHOICE_TIMEOUT_MS = 5000;

function determineWinner(mine: RPSChoice, theirs: RPSChoice): 'win' | 'lose' | 'draw' {
  if (mine === theirs) return 'draw';
  if (
    (mine === 'rock' && theirs === 'scissors') ||
    (mine === 'scissors' && theirs === 'paper') ||
    (mine === 'paper' && theirs === 'rock')
  ) return 'win';
  return 'lose';
}

const RANDOM_CHOICES: RPSChoice[] = ['rock', 'paper', 'scissors'];

export function useRPS() {
  const { user, profile } = useAuthStore();
  const { addToast } = useUiStore();

  const [state, setState] = useState<RPSState>({
    gameState: 'idle',
    opponent: null,
    myChoice: null,
    opponentChoice: null,
    countdown: COUNTDOWN_SEC,
    iAmChallenger: false,
    incomingRequest: null,
  });

  // refs for use inside callbacks/timers
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myChoiceRef = useRef<RPSChoice | null>(null);
  const opponentChoiceRef = useRef<RPSChoice | null>(null);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const choiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (choiceTimerRef.current) clearTimeout(choiceTimerRef.current);
    countdownTimerRef.current = null;
    choiceTimerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    myChoiceRef.current = null;
    opponentChoiceRef.current = null;
    setState({
      gameState: 'idle',
      opponent: null,
      myChoice: null,
      opponentChoice: null,
      countdown: COUNTDOWN_SEC,
      iAmChallenger: false,
      incomingRequest: null,
    });
  }, [clearTimers]);

  // 결과 계산 및 표시
  const resolveResult = useCallback((mine: RPSChoice, theirs: RPSChoice) => {
    clearTimers();
    setState((prev) => ({
      ...prev,
      gameState: 'result',
      myChoice: mine,
      opponentChoice: theirs,
    }));
  }, [clearTimers]);

  // 선택지 타임아웃 처리
  const startChoiceTimer = useCallback((opponent: RPSOpponent) => {
    choiceTimerRef.current = setTimeout(() => {
      // 미선택 시 랜덤
      const mine = myChoiceRef.current ?? RANDOM_CHOICES[Math.floor(Math.random() * 3)];
      const theirs = opponentChoiceRef.current ?? RANDOM_CHOICES[Math.floor(Math.random() * 3)];

      if (!myChoiceRef.current) {
        sendRPSEvent('rps_choice', {
          from: user?.id,
          to: opponent.userId,
          choice: mine,
        });
      }
      resolveResult(mine, theirs);
    }, CHOICE_TIMEOUT_MS);
  }, [user?.id, resolveResult]);

  // 카운트다운 시작
  const startCountdown = useCallback((opponent: RPSOpponent, iAmChallenger: boolean) => {
    clearTimers();
    myChoiceRef.current = null;
    opponentChoiceRef.current = null;

    setState((prev) => ({
      ...prev,
      gameState: 'countdown',
      opponent,
      iAmChallenger,
      countdown: COUNTDOWN_SEC,
      myChoice: null,
      opponentChoice: null,
    }));

    let remaining = COUNTDOWN_SEC;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setState((prev) => ({ ...prev, gameState: 'choosing', countdown: 0 }));
        startChoiceTimer(opponent);
      } else {
        setState((prev) => ({ ...prev, countdown: remaining }));
      }
    }, 1000);
  }, [clearTimers, startChoiceTimer]);

  // 대결 요청 (A → B)
  const requestDuel = useCallback((target: RPSOpponent) => {
    if (!user?.id) return;
    const myName = profile?.nickname || profile?.name || '???';
    sendRPSEvent('rps_request', {
      from: user.id,
      fromName: myName,
      to: target.userId,
    });
    setState((prev) => ({ ...prev, gameState: 'requested', opponent: target, iAmChallenger: true }));
  }, [user?.id, profile?.nickname, profile?.name]);

  // 수락
  const acceptDuel = useCallback(() => {
    const req = stateRef.current.incomingRequest;
    if (!req || !user?.id) return;
    const myName = profile?.nickname || profile?.name || '???';
    sendRPSEvent('rps_accept', {
      from: user.id,
      fromName: myName,
      to: req.userId,
    });
    setState((prev) => ({ ...prev, incomingRequest: null }));
    startCountdown(req, false);
  }, [user?.id, profile?.nickname, profile?.name, startCountdown]);

  // 거절
  const rejectDuel = useCallback(() => {
    const req = stateRef.current.incomingRequest;
    if (!req || !user?.id) return;
    sendRPSEvent('rps_reject', {
      from: user.id,
      to: req.userId,
    });
    setState((prev) => ({ ...prev, incomingRequest: null, gameState: 'idle' }));
  }, [user?.id]);

  // 선택
  const makeChoice = useCallback((choice: RPSChoice) => {
    const cur = stateRef.current;
    if (cur.gameState !== 'choosing' || myChoiceRef.current || !cur.opponent || !user?.id) return;
    myChoiceRef.current = choice;
    setState((prev) => ({ ...prev, myChoice: choice }));
    sendRPSEvent('rps_choice', {
      from: user.id,
      to: cur.opponent.userId,
      choice,
    });
    // 상대방이 이미 선택했다면 즉시 결과
    if (opponentChoiceRef.current) {
      resolveResult(choice, opponentChoiceRef.current);
    }
  }, [user?.id, resolveResult]);

  // 결과: 승/패/무 계산
  const getResult = useCallback((): 'win' | 'lose' | 'draw' | null => {
    const { myChoice, opponentChoice } = stateRef.current;
    if (!myChoice || !opponentChoice) return null;
    return determineWinner(myChoice, opponentChoice);
  }, []);

  // Realtime 이벤트 수신
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeRPS((event, payload) => {
      const cur = stateRef.current;

      if (event === 'rps_request') {
        // 나에게 온 요청인지 확인
        if (payload.to !== user.id) return;
        // 이미 게임 중이면 자동 거절
        if (cur.gameState !== 'idle') {
          sendRPSEvent('rps_reject', { from: user.id, to: payload.from as string });
          return;
        }
        setState((prev) => ({
          ...prev,
          incomingRequest: {
            userId: payload.from as string,
            name: payload.fromName as string,
          },
        }));
      }

      if (event === 'rps_accept') {
        if (payload.to !== user.id) return;
        if (!cur.iAmChallenger || cur.gameState !== 'requested') return;
        const opponent: RPSOpponent = {
          userId: payload.from as string,
          name: payload.fromName as string,
        };
        startCountdown(opponent, true);
      }

      if (event === 'rps_reject') {
        if (payload.to !== user.id) return;
        if (cur.gameState !== 'requested') return;
        reset();
        addToast('상대방이 대결을 거절했습니다', 'info');
      }

      if (event === 'rps_choice') {
        // 나와 관련된 선택인지 확인 (to === me)
        if (payload.to !== user.id) return;
        opponentChoiceRef.current = payload.choice as RPSChoice;
        setState((prev) => ({ ...prev, opponentChoice: payload.choice as RPSChoice }));
        // 내가 이미 선택했다면 즉시 결과
        if (myChoiceRef.current && cur.opponent) {
          resolveResult(myChoiceRef.current, payload.choice as RPSChoice);
        }
      }
    });

    return unsubscribe;
  }, [user?.id, addToast, reset, startCountdown, resolveResult]);

  return {
    state,
    requestDuel,
    acceptDuel,
    rejectDuel,
    makeChoice,
    getResult,
    reset,
  };
}
