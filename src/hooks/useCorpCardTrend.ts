import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface TrendPoint {
  date: string;            // YYYY-MM-DD
  capturedAt: string;      // ISO
  totalUsed: number;       // 그 시점의 총 소진액 (sin+mis+non 합)
  totalPlanned: number;
  sin: number;             // 저장
  mis: number;             // 처리중
  non: number;             // 완료
}

export interface CorpCardTrendResult {
  loading: boolean;
  error: string | null;
  points: TrendPoint[];
  /** 전일 대비 증감률 (%) — 최근 2개 포인트 기준 */
  dodChangePct: number | null;
}

/**
 * 최근 N일간의 snapshot 을 일별로 묶어 소진 추이 반환.
 * 하루에 여러 번 수집돼도 해당 날짜의 "가장 최근 것"만 사용.
 */
export function useCorpCardTrend(team: string, days: number = 14): CorpCardTrendResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<TrendPoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true); setError(null);
      try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data: snaps, error: snapErr } = await supabase
          .from('corp_card_snapshots')
          .select('id, captured_at, period_ym, team')
          .eq('team', team)
          .gte('captured_at', since.toISOString())
          .order('captured_at', { ascending: true });
        if (snapErr) throw snapErr;
        if (!snaps || snaps.length === 0) {
          if (!cancelled) setPoints([]);
          return;
        }

        const snapshotIds = snaps.map((s) => s.id);
        const { data: accts, error: accErr } = await supabase
          .from('corp_card_accounts')
          .select('snapshot_id, base_amt, sin_bdget, mis_bdget, non_bdget')
          .in('snapshot_id', snapshotIds);
        if (accErr) throw accErr;

        const bySnap: Record<string, { base: number; sin: number; mis: number; non: number }> = {};
        (accts ?? []).forEach((a) => {
          const s = (bySnap[a.snapshot_id] ??= { base: 0, sin: 0, mis: 0, non: 0 });
          s.base += a.base_amt || 0;
          s.sin += a.sin_bdget || 0;
          s.mis += a.mis_bdget || 0;
          s.non += a.non_bdget || 0;
        });

        // 날짜별 최신 snapshot 만 유지
        const byDate = new Map<string, TrendPoint>();
        for (const s of snaps) {
          const d = s.captured_at.slice(0, 10);
          const agg = bySnap[s.id] ?? { base: 0, sin: 0, mis: 0, non: 0 };
          const pt: TrendPoint = {
            date: d,
            capturedAt: s.captured_at,
            totalPlanned: agg.base,
            totalUsed: agg.sin + agg.mis + agg.non,
            sin: agg.sin,
            mis: agg.mis,
            non: agg.non,
          };
          const prev = byDate.get(d);
          if (!prev || prev.capturedAt < pt.capturedAt) byDate.set(d, pt);
        }
        const arr = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
        if (!cancelled) setPoints(arr);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? '추이 로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [team, days]);

  const dodChangePct = (() => {
    if (points.length < 2) return null;
    const prev = points[points.length - 2].totalUsed;
    const cur = points[points.length - 1].totalUsed;
    if (prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  })();

  return { loading, error, points, dodChangePct };
}
