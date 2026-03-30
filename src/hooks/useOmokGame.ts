import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

type Stone = 0 | 1 | 2; // 0=빈칸, 1=흑, 2=백
export type GameStatus = 'waiting' | 'playing' | 'finished';

export const BOARD_SIZE = 15;

function createEmptyBoard(): Stone[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array<Stone>(BOARD_SIZE).fill(0));
}

function checkWin(board: Stone[][], row: number, col: number, stone: Stone): boolean {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== stone) break;
      count++;
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== stone) break;
      count++;
    }
    if (count >= 5) return true;
  }
  return false;
}

export interface OmokPlayer {
  id: string;
  name: string;
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const gameStartedRef = useRef(false);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel('omok-game', {
      config: { presence: { key: profile.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: OmokPlayer[] = Object.values(state)
        .flat()
        .map((u: any) => ({ id: u.user_id as string, name: u.name as string }));
      setPlayers(users);

      // 2명 모이면 게임 시작 (아직 시작 안 했을 때만)
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
    });

    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      const { row, col, stone, nextTurn, isWin } = payload as {
        row: number; col: number; stone: 1 | 2; nextTurn: 1 | 2; isWin: boolean;
      };
      setBoard((prev) => {
        const next = prev.map((r) => [...r]);
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

    channel.on('broadcast', { event: 'reset' }, () => {
      setBoard(createEmptyBoard());
      setCurrentTurn(1);
      setWinner(null);
      setLastMove(null);
      setStatus('playing');
    });

    channel.subscribe(async (st) => {
      if (st === 'SUBSCRIBED') {
        await channel.track({
          user_id: profile.id,
          name: profile.nickname || profile.name,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      gameStartedRef.current = false;
      channel.unsubscribe();
    };
  }, [profile]);

  const makeMove = useCallback(
    (row: number, col: number) => {
      if (status !== 'playing' || myColor !== currentTurn || board[row][col] !== 0) return;

      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = myColor;
      const isWin = checkWin(newBoard, row, col, myColor);
      const nextTurn: 1 | 2 = myColor === 1 ? 2 : 1;

      setBoard(newBoard);
      setCurrentTurn(nextTurn);
      setLastMove({ row, col });
      if (isWin) {
        setWinner(myColor);
        setStatus('finished');
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
    channelRef.current?.send({ type: 'broadcast', event: 'reset', payload: {} });
  }, []);

  return { board, status, currentTurn, myColor, players, winner, lastMove, makeMove, resetGame };
}
