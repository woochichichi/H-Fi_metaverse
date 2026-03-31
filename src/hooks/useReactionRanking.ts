import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { ReactionRanking } from '../types/database';

export function useReactionRanking() {
  const [ranking, setRanking] = useState<ReactionRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        () => supabase.from('reaction_ranking').select('*').order('best_avg_ms', { ascending: true }).limit(20),
        8000, 'reactionRanking',
      );
      if (error) {
        console.error('반응속도 랭킹 조회 실패:', error.message);
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
