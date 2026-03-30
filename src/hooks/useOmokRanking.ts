import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { OmokRanking } from '../types/database';

export function useOmokRanking() {
  const [ranking, setRanking] = useState<OmokRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('omok_ranking')
      .select('*')
      .order('wins', { ascending: false })
      .limit(20);
    setRanking(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { ranking, loading, refetch: fetchRanking };
}

export async function saveOmokResult(winnerId: string, loserId: string) {
  const { error } = await supabase
    .from('omok_records')
    .insert({ winner_id: winnerId, loser_id: loserId });
  if (error) console.error('오목 전적 저장 실패:', error.message);
}
