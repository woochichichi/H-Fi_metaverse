/**
 * 법인카드 현황판 — 타입 + 포맷 헬퍼.
 * 실데이터는 Supabase에서 useCorpCardLive 훅으로 조회한다.
 */

export interface CorpAccount {
  code: string;
  name: string;
  shortName: string;
  icon: string;
  category: 'meal' | 'team' | 'transport' | 'meeting';
  planned: number;
  saved: number;
  pending: number;
  completed: number;
}

export interface CorpTransaction {
  no: number;
  ea: string;
  regDate: string;
  postDate: string;
  amount: number;
  writer: string;
  payee: string;
  user: string;
  memo: string;
  status: '승인' | '처리중' | '반려';
  docNo: string;
  /** 회계 계정 코드 — 53001040=식대, 53401010=교통, 53405010=회의. 오분류 방지용 authoritative 분류 키 */
  acctCode: string;
}

export interface CorpMember {
  name: string;
  cardLast4: string;
  joinYear: number;
  active: boolean;
}

export interface DashboardStats {
  accounts: (CorpAccount & { used: number; remaining: number })[];
  totalPlanned: number;
  totalUsed: number;
  totalRemaining: number;
  activeMembers: (CorpMember & { used: number; count: number; lastTx: string | null })[];
  inactiveMembers: CorpMember[];
  txThisMonth: CorpTransaction[];
  dayMap: Record<string, number>;
  monthBudget: number;
  monthUsed: number;
  monthRemaining: number;
  expectedByNow: number;
  burnPct: number;
  projectedMonth: number;
  projectedQuarterEnd: number;
  projectedQuarterPct: number;
  daysElapsed: number;
  daysInMonth: number;
  weeksRemaining: number;
  weeklyAvailable: number;
  paceStatus: 'danger' | 'warn' | 'ok' | 'info';
  paceDesc: string;
  lastMonthTotal: number;
  monthDelta: number;
}

// ───── 포맷 헬퍼 ─────

export function classifyTransaction(memo: string): { account: string; icon: string; label: string } {
  if (/택시|교통|버스|기차/.test(memo)) return { account: '53401010', icon: '🚕', label: '교통' };
  if (/회의|간담회|미팅|리뷰|점검|워크샵|멘토링|네트워|팀회의|unit회의/.test(memo)) return { account: '53405010', icon: '💬', label: '회의' };
  if (/야근|배민|도시락|점심|저녁|식대|회식|환영|온보딩|분식/.test(memo)) return { account: '53001040', icon: '🍱', label: '식대' };
  return { account: '53001040', icon: '📋', label: '기타' };
}

/**
 * acct_code 기반 용도 분류 — 도넛/트렌드 차트는 이 함수를 사용.
 * memo 기반 classifyTransaction 은 memo 텍스트가 "택시비로 회의 참석" 같이 복합 의미를 담아
 * 식대/교통 거래가 회의로 잘못 분류되는 이슈가 있어, 회계 계정 코드를 authoritative 분류 키로 사용.
 */
export function classifyByAcctCode(acctCode: string): { account: string; icon: string; label: string } {
  if (acctCode === '53001040') return { account: acctCode, icon: '🍱', label: '식대' };
  if (acctCode === '53401010') return { account: acctCode, icon: '🚕', label: '교통' };
  if (acctCode === '53405010') return { account: acctCode, icon: '💬', label: '회의' };
  return { account: acctCode || '-', icon: '📋', label: '기타' };
}

export function extractHeadcount(memo: string): number {
  const m = memo.match(/외\s*(\d+)\s*명/);
  if (m) return parseInt(m[1], 10) + 1;
  const m2 = memo.match(/(\d+)\s*명/);
  if (m2) return parseInt(m2[1], 10);
  return 1;
}

export const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(Math.round(n));
export const fmtKR = (n: number) => {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return (n / 10000).toFixed(0) + '만';
  return fmt(n);
};
export const fmtKRDecimal = (n: number) => {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '억';
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  return fmt(n);
};
export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

// 아바타 색상 — 한울타리 팔레트
const AVATAR_COLORS = ['#6C5CE7', '#FF6B9D', '#FFD93D', '#95E86B', '#C49AFF', '#FF9A6B', '#6BFFD4', '#7AB8F5'];
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
export const initial = (name: string) => (name ? name[name.length - 1] : '?');
