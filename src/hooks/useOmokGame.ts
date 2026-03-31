import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { saveOmokResult } from './useOmokRanking';
import { checkWinRenju, isForbidden, computeForbiddenCells } from '../lib/renju';

type Stone = 0 | 1 | 2; // 0=빈칸, 1=흑, 2=백
export type GameStatus = 'waiting' | 'playing' | 'finished';

export const BOARD_SIZE = 15;
const TURN_TIME = 60; // 1분

function createEmptyBoard(): Stone[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array<Stone>(BOARD_SIZE).fill(0));
}

export interface OmokPlayer {
  id: string;
  name: string;
  realName: string;
  team: string;
}

export function useOmokGame() {
  const { profile } = useAuthStore();
  const [board, setBoard] = useState<Stone[][]>(createEmptyBoard());
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [myColor, setMyColor] = useState<1 | 2 | null>(null);
  const [players, setPlayers] = useState<OmokPlayer[]>([]);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const gameStartedRef = useRef(false);
  const resultSavedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 금수 위치 계산 (흑 차례일 때만)
  const forbiddenCells = useMemo(() => {
    if (status !== 'playing' || currentTurn !== 1) return null;
    return computeForbiddenCells(board);
  }, [board, status, currentTurn]);

  // 타이머
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
      setPlayers(users);

      // 2명 모이면 게임 시작
      if (users.length >= 2 && !gameStartedRef.current) {
        gameStartedRef.current = true;
        const sorted = [...users].sort((a, b) => a.id.localeCompare(b.id));
        const myIdx = sorted.findIndex((u) => u.id === profile.id);
        setMyColor(myIdx === 0 ? 1 : 2);
        setStatus('playing');
        setBoard(createEmptyBoard());
        setCurrentTurn(1);
        setWinner(null);
        setLastMove(null);
      }

      // 상대방 퇴장 → 승리
      if (users.length < 2 && gameStartedRef.current && !winner) {
        setStatus('finished');
        const me = users.find((u) => u.id === profile.id);
        if (me && myColor) setWinner(myColor);
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
      if (isWin) {
        setWinner(stone);
        setStatus('finished');
      }
    });

    channel.on('broadcast', { event: 'timeout' }, ({ payload }) => {
      const { loser } = payload as { loser: 1 | 2 };
      const winnerColor: 1 | 2 = loser === 1 ? 2 : 1;
      setWinner(winnerColor);
      setStatus('finished');
    });

    channel.on('broadcast', { event: 'reset' }, () => {
      setBoard(createEmptyBoard());
      setCurrentTurn(1);
      setWinner(null);
      setLastMove(null);
      setStatus('playing');
      setTimeLeft(TURN_TIME);
      resultSavedRef.current = false;
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
      channel.send({ type: 'broadcast', event: 'forfeit', payload: { userId: profile.id } });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      gameStartedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
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
    setLastMove(null);
    setStatus('playing');
    setTimeLeft(TURN_TIME);
    resultSavedRef.current = false;
    channelRef.current?.send({ type: 'broadcast', event: 'reset', payload: {} });
  }, []);

  return {
    board, status, currentTurn, myColor, players, winner, lastMove,
    timeLeft, forbiddenCells, makeMove, resetGame, TURN_TIME,
  };
}
