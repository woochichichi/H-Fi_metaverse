import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface MyCardPendingRow {
  id: number;
  captured_at: string;
  add_date: string | null;
  card_last4: string | null;
  store_name: string | null;
  amount: number;
  status_nm: string | null;
}

export interface MyCardPendingResult {
  loading: boolean;
  error: string | null;
  /** 가장 최근 수집 시각의 건만 (그 이전 수집분은 히스토리) */
  latestCapturedAt: string | null;
  rows: MyCardPendingRow[];
  totalAmount: number;
  overdueRows: MyCardPendingRow[];  // 승인 후 72h 경과
}

/**
 * 본인 카드 원본(EA 미생성) 실시간 조회.
 * RLS 로 emp_no = 본인 profiles.employee_no 만 반환.
 */
export function useMyCardPending(): MyCardPendingResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MyCardPendingRow[]>([]);
  const [latestCapturedAt, setLatest] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 가장 최근 captured_at 시점의 본인 미처리 건만 (RLS가 emp_no 매칭)
        const { data: latestRow, error: latestErr } = await supabase
          .from('corp_card_personal_pending')
          .select('captured_at')
          .order('captured_at', { ascending: false })
          .limit(1);
        if (latestErr) throw latestErr;
        if (!latestRow || latestRow.length === 0) {
          if (!cancelled) { setRows([]); setLatest(null); }
          return;
        }
        const latest = latestRow[0].captured_at;

        const { data, error } = await supabase
          .from('corp_card_personal_pending')
          .select('id, captured_at, add_date, card_last4, store_name, amount, status_nm')
          .eq('captured_at', latest)
          .order('add_date', { ascending: false });
        if (error) throw error;

        if (!cancelled) {
          setRows((data ?? []) as MyCardPendingRow[]);
          setLatest(latest);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? '카드 원본 조회 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const totalAmount = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const now = Date.now();
  const OVERDUE_MS = 72 * 60 * 60 * 1000;
  const overdueRows = rows.filter((r) => {
    if (!r.add_date) return false;
    const t = new Date(r.add_date).getTime();
    return now - t > OVERDUE_MS;
  });

  return { loading, error, latestCapturedAt, rows, totalAmount, overdueRows };
}
