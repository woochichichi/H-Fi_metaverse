import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface QuarterPoint {
  /** 분기 시작일로부터 경과일 (0~N) */
  day: number;
  /** 그 시점까지의 누적 소진액 */
  used: number;
  /** 실제 날짜 (YYYY-MM-DD) — tooltip 용 */
  date: string;
}

export interface QuarterSeries {
  periodYm: string;      // '202604', '202601' 등
  label: string;         // '2026 Q2', '2026 Q1'
  quarterStart: string;  // YYYY-MM-DD
  quarterEnd: string;    // YYYY-MM-DD
  daysInQuarter: number; // 90~92
  totalPlanned: number;
  points: QuarterPoint[];
}

export interface QuarterCompareResult {
  loading: boolean;
  error: string | null;
  /** 가장 최신 분기 (진행 중일 수 있음) */
  current: QuarterSeries | null;
  /** 직전 분기 (완료됨) */
  previous: QuarterSeries | null;
  /** current 의 "오늘" 경과일 (prev 와 비교할 때 하이라이트 지점) */
  currentTodayDay: number | null;
}

function quarterInfo(periodYm: string) {
  const y = parseInt(periodYm.slice(0, 4), 10);
  const m = parseInt(periodYm.slice(4, 6), 10);
  const q = Math.ceil(m / 3);           // 1~4
  const startMonth = (q - 1) * 3 + 1;    // Q2 -> 4
  const endMonth = q * 3;                // Q2 -> 6
  const start = new Date(y, startMonth - 1, 1);
  const end = new Date(y, endMonth, 0);  // 그 월의 마지막 날
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return { y, m, q, startMonth, endMonth, start, end, days };
}

function prevQuarterPeriodYm(periodYm: string): string {
  const { y, q, startMonth } = quarterInfo(periodYm);
  let py = y, pq = q - 1, pStartMonth = startMonth - 3;
  if (pq === 0) {
    pq = 4;
    py = y - 1;
    pStartMonth = 10;
  }
  return `${py}${String(pStartMonth).padStart(2, '0')}`;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function labelFor(periodYm: string): string {
  const info = quarterInfo(periodYm);
  return `${info.y} Q${info.q}`;
}

function buildSeries(
  periodYm: string,
  txs: Array<{ add_date: string | null; amount: number | null }>,
  totalPlanned: number,
  untilDay: number | null,
): QuarterSeries {
  const info = quarterInfo(periodYm);

  const byDay: Record<number, number> = {};
  for (const tx of txs) {
    if (!tx.add_date) continue;
    const parts = tx.add_date.split('-');
    if (parts.length < 3) continue;
    const td = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const day = Math.floor((td.getTime() - info.start.getTime()) / 86400000);
    if (day < 0 || day >= info.days) continue;
    byDay[day] = (byDay[day] ?? 0) + (tx.amount ?? 0);
  }

  const maxDay = untilDay !== null ? Math.min(untilDay, info.days - 1) : info.days - 1;
  const points: QuarterPoint[] = [];
  let cum = 0;
  for (let d = 0; d <= maxDay; d++) {
    cum += byDay[d] ?? 0;
    const dt = new Date(info.start);
    dt.setDate(dt.getDate() + d);
    points.push({ day: d, used: cum, date: fmtDate(dt) });
  }

  return {
    periodYm,
    label: labelFor(periodYm),
    quarterStart: fmtDate(info.start),
    quarterEnd: fmtDate(info.end),
    daysInQuarter: info.days,
    totalPlanned,
    points,
  };
}

async function loadSeries(
  team: string,
  periodYm: string,
  untilDay: number | null,
): Promise<QuarterSeries | null> {
  const { data: snaps, error: snapErr } = await supabase
    .from('corp_card_snapshots')
    .select('id, period_ym, captured_at')
    .eq('team', team)
    .eq('period_ym', periodYm)
    .order('captured_at', { ascending: false })
    .limit(1);
  if (snapErr) throw snapErr;
  if (!snaps || snaps.length === 0) return null;
  const snapId = snaps[0].id;

  const [{ data: accts, error: accErr }, { data: txs, error: txErr }] = await Promise.all([
    supabase
      .from('corp_card_accounts')
      .select('base_amt')
      .eq('snapshot_id', snapId),
    supabase
      .from('corp_card_transactions')
      .select('add_date, amount')
      .eq('snapshot_id', snapId),
  ]);
  if (accErr) throw accErr;
  if (txErr) throw txErr;

  const totalPlanned = (accts ?? []).reduce((s, a: any) => s + (a.base_amt ?? 0), 0);
  return buildSeries(periodYm, txs ?? [], totalPlanned, untilDay);
}

export function useQuarterCompare(team: string): QuarterCompareResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<QuarterSeries | null>(null);
  const [previous, setPrevious] = useState<QuarterSeries | null>(null);
  const [currentTodayDay, setCurrentTodayDay] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 가장 최근 분기(period_ym DESC) 의 snapshot 기준으로 현재 분기 결정.
        // captured_at 만으로 정렬하면 같은 시각에 업로드된 여러 분기 중 엉뚱한 게 잡힘.
        const { data: latest, error: latestErr } = await supabase
          .from('corp_card_snapshots')
          .select('id, period_ym, captured_at')
          .eq('team', team)
          .order('period_ym', { ascending: false })
          .order('captured_at', { ascending: false })
          .limit(1);
        if (latestErr) throw latestErr;
        if (!latest || latest.length === 0) {
          if (!cancelled) {
            setCurrent(null);
            setPrevious(null);
            setCurrentTodayDay(null);
          }
          return;
        }

        const curPeriod = latest[0].period_ym as string;
        const prevPeriod = prevQuarterPeriodYm(curPeriod);

        // 현재 분기는 오늘까지만 그림
        const info = quarterInfo(curPeriod);
        const today = new Date();
        const todayDay = Math.floor(
          (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
            info.start.getTime()) /
            86400000,
        );
        const isCurrentQuarter = todayDay >= 0 && todayDay < info.days;
        const untilDayForCurrent = isCurrentQuarter ? todayDay : null; // 완료된 분기면 끝까지

        const [cur, prev] = await Promise.all([
          loadSeries(team, curPeriod, untilDayForCurrent),
          loadSeries(team, prevPeriod, null),
        ]);

        if (cancelled) return;
        setCurrent(cur);
        setPrevious(prev);
        setCurrentTodayDay(isCurrentQuarter ? todayDay : null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? '분기 비교 로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [team]);

  return { loading, error, current, previous, currentTodayDay };
}
