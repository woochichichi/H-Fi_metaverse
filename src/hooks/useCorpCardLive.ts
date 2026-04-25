import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { DashboardStats, CorpAccount, CorpTransaction } from '../lib/corpCardMockData';

interface SnapshotRow {
  id: string;
  captured_at: string;
  period_ym: string;
  dept_cd: string;
  team: string;
}

interface AccountRow {
  acct_code: string;
  acct_name: string;
  base_amt: number;
  sin_bdget: number;
  mis_bdget: number;
  non_bdget: number;
  rst_amt: number;
}

interface TxRow {
  slip_no: string | null;
  rtn_type: string | null;
  acct_code: string | null;
  add_date: string | null;
  posting_date: string | null;
  user_nm: string | null;
  real_user_name: string | null;
  store_name: string | null;
  t_text: string | null;
  status_nm: string | null;
  amount: number;
}

export interface CorpCardLiveResult {
  loading: boolean;
  error: string | null;
  snapshot: SnapshotRow | null;
  stats: DashboardStats | null;
  transactions: CorpTransaction[];
}

/**
 * 최신 법인카드 snapshot 을 Supabase 에서 가져와 DashboardStats 로 환산.
 * 데이터가 없으면 snapshot=null 로 반환 (빈 상태 UI 용).
 */
export function useCorpCardLive(team: string): CorpCardLiveResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotRow | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<CorpTransaction[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1) 가장 최근 분기(period_ym DESC)의 최신 snapshot 1건
        //    captured_at 만으로 정렬하면 동시에 업로드된 여러 분기 중 엉뚱한 게 잡힘.
        const { data: snapRows, error: snapErr } = await supabase
          .from('corp_card_snapshots')
          .select('id, captured_at, period_ym, dept_cd, team')
          .eq('team', team)
          .order('period_ym', { ascending: false })
          .order('captured_at', { ascending: false })
          .limit(1);

        if (snapErr) throw snapErr;
        if (!snapRows || snapRows.length === 0) {
          if (!cancelled) {
            setSnapshot(null);
            setStats(null);
            setTransactions([]);
          }
          return;
        }
        const snap = snapRows[0] as SnapshotRow;

        // 2) 계정 + 거래
        const [{ data: accountRows, error: accErr }, { data: txRows, error: txErr }] = await Promise.all([
          supabase
            .from('corp_card_accounts')
            .select('acct_code, acct_name, base_amt, sin_bdget, mis_bdget, non_bdget, rst_amt')
            .eq('snapshot_id', snap.id),
          supabase
            .from('corp_card_transactions')
            .select('slip_no, rtn_type, acct_code, add_date, posting_date, user_nm, real_user_name, store_name, t_text, status_nm, amount')
            .eq('snapshot_id', snap.id)
            .order('add_date', { ascending: false }),
        ]);
        if (accErr) throw accErr;
        if (txErr) throw txErr;

        const accounts = (accountRows as AccountRow[] ?? []).map(toAccount);
        const txs = (txRows as TxRow[] ?? []).map(toTx);
        const stats = computeStats(accounts, txs, snap.period_ym);

        if (!cancelled) {
          setSnapshot(snap);
          setStats(stats);
          setTransactions(txs);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? '법인카드 데이터 로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [team]);

  return { loading, error, snapshot, stats, transactions };
}

// ───── 환산 헬퍼 ─────

function toAccount(r: AccountRow): CorpAccount & { used: number; remaining: number } {
  const used = (r.sin_bdget ?? 0) + (r.mis_bdget ?? 0) + (r.non_bdget ?? 0);
  return {
    code: r.acct_code,
    name: r.acct_name,
    shortName: shortenAcct(r.acct_name),
    icon: iconForAcct(r.acct_code),
    category: categoryFor(r.acct_code),
    planned: r.base_amt ?? 0,
    saved: r.sin_bdget ?? 0,
    pending: r.mis_bdget ?? 0,
    completed: r.non_bdget ?? 0,
    used,
    remaining: (r.base_amt ?? 0) - used,
  };
}

function toTx(r: TxRow): CorpTransaction {
  return {
    no: 0,
    ea: r.slip_no ?? '',
    regDate: r.add_date ?? '',
    postDate: r.posting_date ?? '',
    amount: r.amount ?? 0,
    writer: r.user_nm ?? '',
    payee: r.store_name ?? '',
    user: r.real_user_name || r.user_nm || '',
    memo: r.t_text ?? '',
    status: (r.status_nm as any) || '승인',
    docNo: '',
    acctCode: r.acct_code ?? '',
  };
}

function shortenAcct(name: string): string {
  // SAP 풀 이름(예: "복리후생비-업무추진식대") → 화면용 짧은 이름.
  // dash 뒷부분 + "식대"/"비" 어미 정리.
  const tail = name.split('-').pop() ?? name;
  // "업무추진식대" → "업무추진", "업무회의비" → "업무회의", "시내교통비" → "교통비"
  if (tail === '업무추진식대') return '업무추진';
  if (tail === '업무회의비') return '업무회의';
  if (tail === '시내교통비') return '교통비';
  return tail;
}

function iconForAcct(code: string): string {
  if (code === '53001040') return '🍱';
  if (code === '53401010') return '🚕';
  if (code === '53405010') return '💬';
  return '📋';
}

function categoryFor(code: string): CorpAccount['category'] {
  if (code === '53001040') return 'meal';
  if (code === '53401010') return 'transport';
  if (code === '53405010') return 'meeting';
  return 'team';
}

/**
 * DashboardStats 계산 — corpCardMockData 의 computeDashboardStats 와 동일 로직이지만
 * today 를 snapshot 의 period_ym 기준으로 도출 (실시간 값 아니라 수집 시점 기준).
 */
function computeStats(
  accounts: (CorpAccount & { used: number; remaining: number })[],
  txs: CorpTransaction[],
  periodYm: string,
): DashboardStats {
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

  const totalPlanned = accounts.reduce((s, a) => s + a.planned, 0);
  const totalUsed = accounts.reduce((s, a) => s + a.used, 0);
  const totalRemaining = totalPlanned - totalUsed;

  // snapshot 기준 "오늘" — period_ym 의 마지막 사용 가능일로 근사. 실제 수집일을 쓰고 싶으면
  // snapshot.captured_at 을 넘겨 받아야 하지만, 여기서는 period_ym 의 "현재 월 N일"로.
  const year = parseInt(periodYm.slice(0, 4), 10);
  const month = parseInt(periodYm.slice(4, 6), 10);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const daysElapsed = isCurrentMonth ? now.getDate() : 30;
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  const weeksRemaining = daysRemaining / 7;
  const monthBudget = totalPlanned / 3;

  const periodPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const txThisMonth = txs.filter((t) => (t.regDate || '').startsWith(periodPrefix));
  const monthUsed = txThisMonth.reduce((s, t) => s + t.amount, 0);
  const monthRemaining = monthBudget - monthUsed;
  const weeklyAvailable = weeksRemaining > 0 ? monthRemaining / weeksRemaining : 0;
  const expectedByNow = monthBudget * (daysElapsed / daysInMonth);
  const burnRate = daysElapsed > 0 ? monthUsed / daysElapsed : 0;
  const projectedMonth = burnRate * daysInMonth;
  const burnPct = pct(monthUsed, expectedByNow);
  const projectedQuarterEnd = totalUsed + burnRate * (61 + daysRemaining);
  const projectedQuarterPct = pct(projectedQuarterEnd, totalPlanned);

  let paceStatus: DashboardStats['paceStatus'];
  let paceDesc: string;
  if (burnPct > 115) { paceStatus = 'danger'; paceDesc = '과속 — 분기 말 초과 가능'; }
  else if (burnPct > 100) { paceStatus = 'warn'; paceDesc = '약간 빠름 — 추세 주시'; }
  else if (burnPct < 60) { paceStatus = 'info'; paceDesc = '여유 — 계획된 지출 점검'; }
  else { paceStatus = 'ok'; paceDesc = '정상 페이스'; }

  const dayMap: Record<string, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dayMap[`${periodPrefix}-${String(d).padStart(2, '0')}`] = 0;
  }
  txThisMonth.forEach((t) => {
    if (t.regDate && dayMap[t.regDate] != null) dayMap[t.regDate] += t.amount;
  });

  // 팀원 집계
  const memberMap = new Map<string, { name: string; cardLast4: string; joinYear: number; active: boolean; used: number; count: number; lastTx: string | null }>();
  txThisMonth.forEach((t) => {
    if (!t.user) return;
    const key = t.user;
    const cur = memberMap.get(key) ?? { name: key, cardLast4: '', joinYear: 0, active: true, used: 0, count: 0, lastTx: null };
    cur.used += t.amount;
    cur.count += 1;
    if (!cur.lastTx || (t.regDate && t.regDate > cur.lastTx)) cur.lastTx = t.regDate;
    memberMap.set(key, cur);
  });
  const activeMembers = Array.from(memberMap.values()).sort((a, b) => b.used - a.used);

  return {
    accounts,
    totalPlanned,
    totalUsed,
    totalRemaining,
    activeMembers,
    inactiveMembers: [],
    txThisMonth,
    dayMap,
    monthBudget,
    monthUsed,
    monthRemaining,
    expectedByNow,
    burnPct,
    projectedMonth,
    projectedQuarterEnd,
    projectedQuarterPct,
    daysElapsed,
    daysInMonth,
    weeksRemaining,
    weeklyAvailable,
    paceStatus,
    paceDesc,
    lastMonthTotal: 0,
    monthDelta: 0,
  };
}
