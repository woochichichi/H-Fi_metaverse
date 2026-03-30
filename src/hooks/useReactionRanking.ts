import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ReactionRanking } from '../types/database';

export function useReactionRanking() {
  const [ranking, setRanking] = useState<ReactionRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reaction_ranking')
      .select('*')
      .order('best_avg_ms', { ascending: true })
      .limit(20);
    setRanking(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { ranking, loading, refetch: fetchRanking };
}
