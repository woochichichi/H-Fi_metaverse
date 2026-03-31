import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { JumpRopeRanking } from '../types/database';

export function useJumpRopeRanking() {
  const [ranking, setRanking] = useState<JumpRopeRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        () => supabase.from('jump_rope_ranking').select('*').order('best_duration_ms', { ascending: false }).limit(30),
        8000, 'jumpRopeRanking',
      );
      if (error) {
        console.error('줄넘기 랭킹 조회 실패:', error.message);
      }
      setRanking(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { ranking, loading, refetch: fetchRanking };
}
