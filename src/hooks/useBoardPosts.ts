import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

/** 존별 최근 게시글 수 (칠판 도트 표시용) */
export type BoardPostCounts = Record<string, number>;

const ZONE_TABLES: { zone: string; table: string; filterDeleted?: boolean }[] = [
  { zone: 'notice', table: 'notices' },
  { zone: 'voc', table: 'vocs', filterDeleted: true },
  { zone: 'gathering', table: 'gatherings' },
  { zone: 'idea', table: 'ideas' },
];

const MAX_DOTS = 12;

export function useBoardPosts() {
  const [counts, setCounts] = useState<BoardPostCounts>({});

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const sinceStr = since.toISOString();

      const results: BoardPostCounts = {};

      await Promise.all(
        ZONE_TABLES.map(async ({ zone, table, filterDeleted }) => {
          try {
            let q = supabase
              .from(table)
              .select('id', { count: 'exact', head: true })
              .gte('created_at', sinceStr);

            if (filterDeleted) {
              q = q.eq('is_deleted', false);
            }

            const { count, error } = await withTimeout(q);
            if (error) throw error;
            results[zone] = Math.min(count ?? 0, MAX_DOTS);
          } catch {
            results[zone] = 0;
          }
        })
      );

      if (!cancelled) setCounts(results);
    };

    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  return counts;
}
