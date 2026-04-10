import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { saveOmokResult } from './useOmokRanking';
import { checkWinRenju, isForbidden, computeForbiddenCells } from '../lib/renju';

type Stone = 0 | 1 | 2; // 0=빈칸, 1=흑, 2=백
export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'finished';

export const BOARD_SIZE = 15;
const TURN_TIME = 60; // 1분
const COUNTDOWN_SEC = 5;

function createEmptyBoard(): Stone[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array<Stone>(BOARD_SIZE).fill(0));
}

export interface OmokPlayer {
  id: string;
  name: string;
  realName: string;
  team: string;
}

export interface ChatMessage {
  sender: string;
  senderColor: 1 | 2;
  text: string;
  ts: number;
}

export interface FloatingEmoji {
  id: number;
  emoji: string;
  senderColor: 1 | 2;
  senderName: string;
  ts: number;
}

export function useOmokGame() {
  const { profile } = useAuthStore();
  const [board, setBoard] = useState<Stone[][]>(createEmptyBoard());
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [myColor, setMyColor] = useState<1 | 2 | null>(null);
  const [players, setPlayers] = useState<OmokPlayer[]>([]);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [winReason, setWinReason] = useState<string | undefined>();
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [placedMove, setPlacedMove] = useState<{ row: number; col: number } | null>(null); // 착수 이펙트용
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const gameStartedRef = useRef(false);
  const resultSavedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emojiIdRef = useRef(0);
  const playersRef = useRef<OmokPlayer[]>([]);

  // 금수 위치 계산 (흑 차례일 때만)
  const forbiddenCells = useMemo(() => {
    if (status !== 'playing' || currentTurn !== 1) return null;
    return computeForbiddenCells(board);
  }, [board, status, currentTurn]);

  // 착수 이펙트: 1초 후 자동 클리어
  useEffect(() => {
    if (!placedMove) return;
    const t = setTimeout(() => setPlacedMove(null), 600);
    return () => clearTimeout(t);
  }, [placedMove]);

  // 플로팅 이모지 자동 제거 (3초)
  useEffect(() => {
    if (floatingEmojis.length === 0) return;
    const t = setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => Date.now() - e.ts < 3000));
    }, 3100);
    return () => clearTimeout(t);
  }, [floatingEmojis]);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (status !== 'countdown') return;

    setCountdown(COUNTDOWN_SEC);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setStatus('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  // 턴 타이머
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (status !== 'playing' || winner) return;

    setTimeLeft(TURN_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 시간 초과 → 현재 턴 플레이어 패배
          clearInterval(timerRef.current!);
          const loser = currentTurn;
          const winnerColor: 1 | 2 = loser === 1 ? 2 : 1;
          setWinner(winnerColor);
          setWinReason('시간 초과');
          setStatus('finished');

          // 시간 초과 broadcast
          channelRef.current?.send({
            type: 'broadcast',
            event: 'timeout',
            payload: { loser },
          });

          // 전적 저장
          if (!resultSavedRef.current && profile && myColor === winnerColor) {
            resultSavedRef.current = true;
            const loserId = players.find((p) => p.id !== profile.id)?.id;
            if (loserId) saveOmokResult(profile.id, loserId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentTurn, status, winner]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel('omok-game', {
      config: { presence: { key: profile.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: OmokPlayer[] = Object.values(state)
        .flat()
        .filter((u: any) => u.user_id)
        .map((u: any) => ({
          id: u.user_id as string,
          name: (u.name as string) ?? '???',
          realName: (u.real_name as string) ?? '',
          team: (u.team as string) ?? '',
        }));
      const prevPlayers = playersRef.current;
      setPlayers(users);
      playersRef.current = users;

      // 2명 모이면 카운트다운 시작
      if (users.length >= 2 && !gameStartedRef.current) {
        gameStartedRef.current = true;
        const sorted = [...users].sort((a, b) => a.id.localeCompare(b.id));
        const myIdx = sorted.findIndex((u) => u.id === profile.id);
        setMyColor(myIdx === 0 ? 1 : 2);
        setStatus('countdown');
        setBoard(createEmptyBoard());
        setCurrentTurn(1);
        setWinner(null);
        setWinReason(undefined);
        setLastMove(null);
        setChatMessages([]);
        setFloatingEmojis([]);
      }

      // 상대방 퇴장 → 승리 (게임 중일 때만)
      if (users.length < 2 && gameStartedRef.current && !winner) {
        const isInGame = ['countdown', 'playing'].includes(status);
        if (isInGame) {
          setStatus('finished');
          setWinReason('상대방 퇴장');
          if (myColor) {
            setWinner(myColor);
            // 전적 저장 — prevPlayers에서 상대 ID를 가져옴
            if (!resultSavedRef.current && profile) {
              resultSavedRef.current = true;
              const leaverId = prevPlayers.find((p) => p.id !== profile.id)?.id;
              if (leaverId) saveOmokResult(profile.id, leaverId);
            }
          }
        }
      }
    });

    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      const { row, col, stone, nextTurn, isWin } = payload as {
        row: number; col: number; stone: 1 | 2; nextTurn: 1 | 2; isWin: boolean;
      };
      setBoard((prev) => {
        const next = prev.map((r) => [...r]);
        if (next[row][col] !== 0) return prev;
        next[row][col] = stone;
        return next;
      });
      setCurrentTurn(nextTurn);
      setLastMove({ row, col });
      setPlacedMove({ row, col });
      if (isWin) {
        setWinner(stone);
        setStatus('finished');
      }
    });

    channel.on('broadcast', { event: 'timeout' }, ({ payload }) => {
      const { loser } = payload as { loser: 1 | 2 };
      const winnerColor: 1 | 2 = loser === 1 ? 2 : 1;
      setWinner(winnerColor);
      setWinReason('시간 초과');
      setStatus('finished');
    });

    channel.on('broadcast', { event: 'forfeit' }, ({ payload }) => {
      const { userId } = payload as { userId: string };
      // 기권한 사람이 상대방이면 내가 승리
      if (userId !== profile.id && !winner) {
        setWinner(myColor ?? 1);
        setWinReason('상대방 기권');
        setStatus('finished');
        // 전적 저장
        if (!resultSavedRef.current && profile && myColor) {
          resultSavedRef.current = true;
          saveOmokResult(profile.id, userId);
        }
      }
    });

    channel.on('broadcast', { event: 'reset' }, () => {
      setBoard(createEmptyBoard());
      setCurrentTurn(1);
      setWinner(null);
      setWinReason(undefined);
      setLastMove(null);
      setPlacedMove(null);
      setStatus('playing');
      setTimeLeft(TURN_TIME);
      setChatMessages([]);
      setFloatingEmojis([]);
      resultSavedRef.current = false;
    });

    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      const msg = payload as ChatMessage;
      setChatMessages((prev) => [...prev.slice(-49), msg]);
    });

    channel.on('broadcast', { event: 'emote' }, ({ payload }) => {
      const { emoji, senderColor, senderName } = payload as { emoji: string; senderColor: 1 | 2; senderName: string };
      setFloatingEmojis((prev) => [
        ...prev,
        { id: emojiIdRef.current++, emoji, senderColor, senderName: senderName || '???', ts: Date.now() },
      ]);
    });

    channel.subscribe(async (st) => {
      if (st === 'SUBSCRIBED') {
        await channel.track({
          user_id: profile.id,
          name: profile.nickname || profile.name,
          real_name: profile.name,
          team: profile.team,
        });
      }
    });

    channelRef.current = channel;

    const handleUnload = () => {
      // 게임 중 퇴장 시 기권 처리 + 전적 저장
      if (gameStartedRef.current && !resultSavedRef.current) {
        channel.send({ type: 'broadcast', event: 'forfeit', payload: { userId: profile.id } });
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      gameStartedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [profile]);

  const makeMove = useCallback(
    (row: number, col: number) => {
      if (status !== 'playing' || myColor !== currentTurn || board[row][col] !== 0) return;

      // 렌주룰: 흑 금수 체크
      if (myColor === 1 && isForbidden(board, row, col)) return;

      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = myColor;
      const isWin = checkWinRenju(newBoard, row, col, myColor);
      const nextTurn: 1 | 2 = myColor === 1 ? 2 : 1;

      setBoard(newBoard);
      setCurrentTurn(nextTurn);
      setLastMove({ row, col });
      setPlacedMove({ row, col });
      if (isWin) {
        setWinner(myColor);
        setStatus('finished');
        if (!resultSavedRef.current && profile) {
          resultSavedRef.current = true;
          const loserId = players.find((p) => p.id !== profile.id)?.id;
          if (loserId) saveOmokResult(profile.id, loserId);
        }
      }

      channelRef.current?.send({
        type: 'broadcast',
        event: 'move',
        payload: { row, col, stone: myColor, nextTurn, isWin },
      });
    },
    [board, currentTurn, myColor, status],
  );

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentTurn(1);
    setWinner(null);
    setWinReason(undefined);
    setLastMove(null);
    setPlacedMove(null);
    setStatus('playing');
    setTimeLeft(TURN_TIME);
    setChatMessages([]);
    setFloatingEmojis([]);
    resultSavedRef.current = false;
    channelRef.current?.send({ type: 'broadcast', event: 'reset', payload: {} });
  }, []);

  const forfeit = useCallback(() => {
    if (status !== 'playing' || !profile || !myColor) return;
    const opponentColor: 1 | 2 = myColor === 1 ? 2 : 1;
    setWinner(opponentColor);
    setWinReason('기권');
    setStatus('finished');

    // 전적 저장 (내가 진 쪽)
    if (!resultSavedRef.current) {
      resultSavedRef.current = true;
      const opponentId = players.find((p) => p.id !== profile.id)?.id;
      if (opponentId) saveOmokResult(opponentId, profile.id);
    }

    channelRef.current?.send({
      type: 'broadcast',
      event: 'forfeit',
      payload: { userId: profile.id },
    });
  }, [status, profile, myColor, players]);

  const sendChat = useCallback(
    (text: string) => {
      if (!profile || !myColor || !text.trim()) return;
      const msg: ChatMessage = {
        sender: profile.nickname || profile.name,
        senderColor: myColor,
        text: text.trim(),
        ts: Date.now(),
      };
      setChatMessages((prev) => [...prev.slice(-49), msg]);
      channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: msg });
    },
    [profile, myColor],
  );

  const sendEmote = useCallback(
    (emoji: string) => {
      if (!myColor || !profile) return;
      const name = profile.nickname || profile.name;
      setFloatingEmojis((prev) => [
        ...prev,
        { id: emojiIdRef.current++, emoji, senderColor: myColor, senderName: name, ts: Date.now() },
      ]);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'emote',
        payload: { emoji, senderColor: myColor, senderName: name },
      });
    },
    [myColor, profile],
  );

  return {
    board, status, currentTurn, myColor, players, winner, winReason, lastMove, placedMove,
    timeLeft, countdown, forbiddenCells, chatMessages, floatingEmojis,
    makeMove, resetGame, forfeit, sendChat, sendEmote, TURN_TIME,
  };
}
