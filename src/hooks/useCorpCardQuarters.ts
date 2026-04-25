import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface QuarterEntry {
  period_ym: string;
  /** 그 분기에 가장 최근 captured_at — 라벨에 표시 가능 */
  latest_captured_at: string;
}

/**
 * 해당 팀의 corp_card_snapshots 에 존재하는 분기 목록.
 * 분기 선택기 드롭다운용 — DB에 데이터가 있는 분기만 노출.
 */
export function useCorpCardQuarters(team: string | null) {
  const [quarters, setQuarters] = useState<QuarterEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!team) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from('corp_card_snapshots')
        .select('period_ym, captured_at')
        .eq('team', team)
        .order('period_ym', { ascending: false })
        .order('captured_at', { ascending: false });
      if (cancelled) return;
      // period_ym 별로 latest captured_at 만 남김
      const map = new Map<string, string>();
      (data ?? []).forEach((r) => {
        if (!map.has(r.period_ym)) map.set(r.period_ym, r.captured_at);
      });
      const list: QuarterEntry[] = Array.from(map.entries())
        .map(([period_ym, latest_captured_at]) => ({ period_ym, latest_captured_at }))
        .sort((a, b) => b.period_ym.localeCompare(a.period_ym));
      setQuarters(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [team]);

  return { quarters, loading };
}

/** period_ym ("202604") → "2026 2분기" 같은 라벨 */
export function quarterLabel(periodYm: string): string {
  const y = periodYm.slice(0, 4);
  const m = parseInt(periodYm.slice(4, 6), 10);
  return `${y} ${Math.ceil(m / 3)}분기`;
}

/** period_ym → 분기 시작/끝 (YYYY-MM-DD) */
export function quarterRange(periodYm: string): { start: string; end: string } {
  const y = parseInt(periodYm.slice(0, 4), 10);
  const m = parseInt(periodYm.slice(4, 6), 10);
  const startMonth = Math.floor((m - 1) / 3) * 3 + 1; // 1, 4, 7, 10
  const endMonth = startMonth + 2;
  const endDay = new Date(y, endMonth, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${y}-${pad(startMonth)}-01`,
    end: `${y}-${pad(endMonth)}-${pad(endDay)}`,
  };
}
