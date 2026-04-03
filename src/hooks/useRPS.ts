import { useEffect, useRef, useCallback, useState } from 'react';
import { subscribeRPS, sendRPSEvent } from './usePlayerSync';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useMetaverseStore } from '../stores/metaverseStore';

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
  iAmChallenger: boolean;
  incomingRequest: RPSOpponent | null;
}

const COUNTDOWN_SEC = 5;
const CHOICE_TIMEOUT_MS = 5000;
const REQUEST_TIMEOUT_MS = 60_000; // 수락 대기 최대 시간
const REQUEST_COOLDOWN_MS = 10_000; // 대결 요청 쿨다운

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

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myChoiceRef = useRef<RPSChoice | null>(null);
  const opponentChoiceRef = useRef<RPSChoice | null>(null);
  const lastRequestTimeRef = useRef<number>(0); // 쿨다운 추적

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const choiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 60초 요청 타임아웃

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (choiceTimerRef.current) clearTimeout(choiceTimerRef.current);
    if (requestTimerRef.current) clearTimeout(requestTimerRef.current);
    countdownTimerRef.current = null;
    choiceTimerRef.current = null;
    requestTimerRef.current = null;
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

  const resolveResult = useCallback((mine: RPSChoice, theirs: RPSChoice) => {
    clearTimers();
    setState((prev) => ({
      ...prev,
      gameState: 'result',
      myChoice: mine,
      opponentChoice: theirs,
    }));
  }, [clearTimers]);

  // 선택 타임아웃: 미선택 시 랜덤 처리
  const startChoiceTimer = useCallback((opponent: RPSOpponent) => {
    choiceTimerRef.current = setTimeout(() => {
      const mine = myChoiceRef.current ?? RANDOM_CHOICES[Math.floor(Math.random() * 3)];
      const theirs = opponentChoiceRef.current ?? RANDOM_CHOICES[Math.floor(Math.random() * 3)];
      if (!myChoiceRef.current) {
        sendRPSEvent('rps_choice', { from: user?.id, to: opponent.userId, choice: mine });
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
    // 쿨다운 체크
    const now = Date.now();
    if (now - lastRequestTimeRef.current < REQUEST_COOLDOWN_MS) {
      addToast('잠시 후 다시 요청할 수 있습니다', 'info');
      return;
    }
    lastRequestTimeRef.current = now;

    const myName = profile?.nickname || profile?.name || '???';
    sendRPSEvent('rps_request', { from: user.id, fromName: myName, to: target.userId });
    setState((prev) => ({ ...prev, gameState: 'requested', opponent: target, iAmChallenger: true }));

    // 60초 요청 타임아웃 (요청자 측)
    requestTimerRef.current = setTimeout(() => {
      if (stateRef.current.gameState === 'requested') {
        reset();
        addToast('시간 초과로 대결 요청이 취소되었습니다', 'info');
      }
    }, REQUEST_TIMEOUT_MS);
  }, [user?.id, profile?.nickname, profile?.name, addToast, reset]);

  // 수락
  const acceptDuel = useCallback(() => {
    const req = stateRef.current.incomingRequest;
    if (!req || !user?.id) return;
    if (requestTimerRef.current) {
      clearTimeout(requestTimerRef.current);
      requestTimerRef.current = null;
    }
    const myName = profile?.nickname || profile?.name || '???';
    sendRPSEvent('rps_accept', { from: user.id, fromName: myName, to: req.userId });
    setState((prev) => ({ ...prev, incomingRequest: null }));
    startCountdown(req, false);
  }, [user?.id, profile?.nickname, profile?.name, startCountdown]);

  // 거절
  const rejectDuel = useCallback(() => {
    const req = stateRef.current.incomingRequest;
    if (!req || !user?.id) return;
    if (requestTimerRef.current) {
      clearTimeout(requestTimerRef.current);
      requestTimerRef.current = null;
    }
    sendRPSEvent('rps_reject', { from: user.id, to: req.userId });
    setState((prev) => ({ ...prev, incomingRequest: null, gameState: 'idle' }));
  }, [user?.id]);

  // 선택
  const makeChoice = useCallback((choice: RPSChoice) => {
    const cur = stateRef.current;
    if (cur.gameState !== 'choosing' || myChoiceRef.current || !cur.opponent || !user?.id) return;
    myChoiceRef.current = choice;
    setState((prev) => ({ ...prev, myChoice: choice }));
    sendRPSEvent('rps_choice', { from: user.id, to: cur.opponent.userId, choice });
    if (opponentChoiceRef.current) {
      resolveResult(choice, opponentChoiceRef.current);
    }
  }, [user?.id, resolveResult]);

  const getResult = useCallback((): 'win' | 'lose' | 'draw' | null => {
    const { myChoice, opponentChoice } = stateRef.current;
    if (!myChoice || !opponentChoice) return null;
    return determineWinner(myChoice, opponentChoice);
  }, []);

  // 상대방 이탈 감지 — otherPlayers에서 사라지면 게임 중단
  useEffect(() => {
    return useMetaverseStore.subscribe((store) => {
      const cur = stateRef.current;
      if (cur.gameState === 'idle' || cur.gameState === 'result') return;
      const opponentId = cur.opponent?.userId ?? cur.incomingRequest?.userId;
      if (!opponentId) return;
      if (!store.otherPlayers.has(opponentId)) {
        reset();
        addToast('상대방이 자리를 떠나 대결이 취소되었습니다', 'info');
      }
    });
  }, [addToast, reset]);

  // Realtime 이벤트 수신
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeRPS((event, payload) => {
      const cur = stateRef.current;

      if (event === 'rps_request') {
        if (payload.to !== user.id) return;
        // 이미 게임 중이거나 다른 요청 대기 중이면 자동 거절 (race condition 방지)
        if (cur.gameState !== 'idle' || cur.incomingRequest !== null) {
          sendRPSEvent('rps_reject', { from: user.id, to: payload.from as string });
          return;
        }
        const requester: RPSOpponent = {
          userId: payload.from as string,
          name: payload.fromName as string,
        };
        setState((prev) => ({ ...prev, incomingRequest: requester }));

        // 수신자 팝업도 60초 후 자동 닫힘
        requestTimerRef.current = setTimeout(() => {
          if (stateRef.current.incomingRequest?.userId === requester.userId) {
            setState((prev) => ({ ...prev, incomingRequest: null }));
          }
        }, REQUEST_TIMEOUT_MS);
      }

      if (event === 'rps_accept') {
        if (payload.to !== user.id) return;
        if (!cur.iAmChallenger || cur.gameState !== 'requested') return;
        // 수락 받으면 요청 타임아웃 취소
        if (requestTimerRef.current) {
          clearTimeout(requestTimerRef.current);
          requestTimerRef.current = null;
        }
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
        if (payload.to !== user.id) return;
        // choosing 상태일 때만 처리 — result 이후 지연 도착 시 덮어씌우기 방지
        if (cur.gameState !== 'choosing') return;
        opponentChoiceRef.current = payload.choice as RPSChoice;
        setState((prev) => ({ ...prev, opponentChoice: payload.choice as RPSChoice }));
        if (myChoiceRef.current) {
          resolveResult(myChoiceRef.current, payload.choice as RPSChoice);
        }
      }
    });

    return unsubscribe;
  }, [user?.id, addToast, reset, startCountdown, resolveResult]);

  return { state, requestDuel, acceptDuel, rejectDuel, makeChoice, getResult, reset };
}
