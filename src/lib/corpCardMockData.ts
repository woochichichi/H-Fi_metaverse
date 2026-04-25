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
 * acct_code 기반 용도 분류 — 단순 회계 분류용 (식대/교통/회의/기타).
 * 사용자에게 보여주는 도넛/트렌드는 classifyByPurpose 를 사용.
 */
export function classifyByAcctCode(acctCode: string): { account: string; icon: string; label: string } {
  if (acctCode === '53001040') return { account: acctCode, icon: '🍱', label: '식대' };
  if (acctCode === '53401010') return { account: acctCode, icon: '🚕', label: '교통' };
  if (acctCode === '53405010') return { account: acctCode, icon: '💬', label: '회의' };
  return { account: acctCode || '-', icon: '📋', label: '기타' };
}

/**
 * 적요(t_text) + 회계계정 기반 **용도 분류** — 사용자가 보고 싶어하는 카테고리.
 *
 * 우선순위(위→아래, 첫 매치에서 종료):
 *   1. 취소: 집계 대상이 아님 → '취소' 라벨로 표시 후 호출자가 필터링
 *   2. 공용/공통: "(공용)"/"(공통)" prefix 가 가장 강한 신호 — 다른 키워드보다 우선
 *   3. 교통(acct=53401010): 회계계정이 교통이면 메모와 무관하게 교통
 *   4. 점검: "점검", "PM/pm" — 시스템 점검·정기 PM 작업
 *   5. 야근: 야근/야간/새벽/주말출근/야식
 *   6. 회식: 회식/송별/환송/환영회/송년/신년회
 *   7. 교육: 교육/세미나/멘토링/전파/소프트랜딩/매뉴얼 정비
 *   8. 간담회: "간담회" 단독 (회식·교육 키워드 없을 때)
 *   9. 현업미팅: 고객사/타사/벤더/협력사/타금융사/외부/현업
 *   10. 팀원교류: 팀워크/팀빌딩/교류/네트워크/조직활성화/친목/면담/케어
 *   11. 회의: 회의/미팅/리뷰/타운홀/설명회/논의/MM
 *   12. 기타: 위 키워드 매칭 다 실패한 거래(=미분류).
 *
 * 주의: 이전엔 fallback으로 '식대'(acct=53001040) 카테고리가 있었으나 제거.
 *   회계계정상 식대지만 적요로 용도가 분류되지 않은 거래는 의미상 "미분류"이므로
 *   별도 라벨로 분리하면 오히려 혼란 — 모두 '기타'로 흡수.
 */
export type PurposeLabel =
  | '취소' | '공용' | '교통' | '점검' | '야근' | '회식' | '교육'
  | '간담회' | '현업미팅' | '팀원교류' | '회의' | '기타';

/**
 * 카테고리별 키워드 사전.
 * - 한글 모음 오타(ㅐ↔ㅔ, ㅗ↔ㅓ 등) 변형 포함
 * - 띄어쓰기·하이픈 변형 포함 (정규식이 단순 substring 매칭이므로 어절 사이는 매치됨)
 * - 영문 대소문자 / 약어 변종 포함
 */
const KEYWORDS = {
  취소: ['승인 취소', '승인취소', '취소건', '취소 건', '반려'],

  공용: [
    '(공용)', '( 공용 )', '(공용 )', '( 공용)',
    '(공통)', '( 공통 )', '(공통 )', '( 공통)',
  ],

  점검: [
    '점검', '겸검', '점겁',                  // 오타
    'PM', 'pm', 'Pm', 'pM',
    '정기 PM', '정기PM', '정기pm',
    '시스템점검', '시스템 점검',
    '장애점검', '장애 점검',
    '운영점검', '점검작업',
  ],

  야근: [
    '야근', '야간', '야간작업', '야간 작업',
    '주말출근', '주말 출근', '주말근무', '주말 근무',
    '새벽', '새벽근무', '심야', '철야',
    '야식', '야간식대', '야근식대', '야근 식대',
    '연장근무', '연장 근무',
  ],

  회식: [
    '회식', '회시', '회씩',                  // 오타
    '송별', '송별회', '송별식',
    '환송', '환송회',
    '환영', '환영회', '환영식',
    '송년', '송년회', '연말회',
    '신년회', '신년 회식',
    '회식비', '단합회', '단합 회식',
  ],

  교육: [
    '교육', '교욱', '교윢',                  // 오타
    '세미나', '세미너',                      // 오타
    '멘토링', '맨토링', '멘터링',            // 오타 (ㅐ/ㅔ)
    '전파교육', '전파 교육', '전파',
    '소프트랜딩', '소프트 랜딩', '소프트렌딩',
    '매뉴얼 정비', '매뉴얼정비', '매뉴얼 작성',
    '워크샵', '워크숍', '워크샵', '워크숖',
    '컨퍼런스', '컨퍼런스', '컨파런스',
    '학회', '학습', '스터디',
    'OJT', 'ojt', '연수',
  ],

  간담회: [
    '간담회', '간담 회', '간담회비',
    '간담희',                                 // 오타 (ㅐ↔ㅔ↔ㅢ)
  ],

  현업미팅: [
    '고객사', '고겍사', '고객 사',           // 오타
    '타사', '타 사', '타금융사', '타 금융사',
    '벤더', '밴더',                           // 오타
    '협력사', '협력 사', '협력업체', '파트너사',
    '외부', '외부미팅', '외부 미팅',
    '현업', '현엽',                           // 오타
    'KB은행', 'KB 은행', 'kb은행',
    '내방', '방문자', '방문',
  ],

  팀원교류: [
    '팀워크', '팀웤', '팀워그',              // 오타
    '팀빌딩', '팀 빌딩', '팀빌',
    '교류', '교유', '교뮤',                  // 오타 ("MCI사원간교유" 같은 케이스 잡기)
    '네트워크', '네트워킹', '네크워크',
    '조직활성화', '조직 활성화', '조직 활성화 이벤트',
    '친목', '친목도모',
    '면담', '면담회', '먼담',
    '케어', '캐어',                           // 오타
    '팀원 교류', '인적네트워크',
  ],

  회의: [
    '회의', '회으', '회이', '회위',          // 오타 (모음)
    '미팅', '미링',                          // 오타
    '리뷰', '리뷰미팅', '리뷰 미팅',
    '타운홀', '타운 홀', '타운홀미팅',
    '설명회', '설명 회',
    '논의', '논으',                          // 오타
    'TF', 'tf',                              // Task Force
    'MM',                                    // mtg minutes 또는 미팅
    '발표회', '발표 회',
    '인터뷰',
    '주간회의', '주간 회의', '월간회의', '월간 회의',
  ],
};

/** 키워드 배열을 정규식으로 컴파일 (한 번만). 특수문자 이스케이프. */
function compileKw(kws: string[]): RegExp {
  const escaped = kws.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(escaped);
}
const RE = {
  취소: compileKw(KEYWORDS.취소),
  공용: compileKw(KEYWORDS.공용),
  점검: compileKw(KEYWORDS.점검),
  야근: compileKw(KEYWORDS.야근),
  회식: compileKw(KEYWORDS.회식),
  교육: compileKw(KEYWORDS.교육),
  간담회: compileKw(KEYWORDS.간담회),
  현업미팅: compileKw(KEYWORDS.현업미팅),
  팀원교류: compileKw(KEYWORDS.팀원교류),
  회의: compileKw(KEYWORDS.회의),
};

export function classifyByPurpose(memo: string, acctCode: string): { label: PurposeLabel; color: string } {
  const m = memo ?? '';

  if (RE.취소.test(m)) return { label: '취소', color: COLOR.취소 };
  if (RE.공용.test(m)) return { label: '공용', color: COLOR.공용 };
  if (acctCode === '53401010') return { label: '교통', color: COLOR.교통 };
  if (RE.점검.test(m)) return { label: '점검', color: COLOR.점검 };
  if (RE.야근.test(m)) return { label: '야근', color: COLOR.야근 };
  if (RE.회식.test(m)) return { label: '회식', color: COLOR.회식 };
  if (RE.교육.test(m)) return { label: '교육', color: COLOR.교육 };
  if (RE.간담회.test(m)) return { label: '간담회', color: COLOR.간담회 };
  if (RE.현업미팅.test(m)) return { label: '현업미팅', color: COLOR.현업미팅 };
  if (RE.팀원교류.test(m)) return { label: '팀원교류', color: COLOR.팀원교류 };
  if (RE.회의.test(m)) return { label: '회의', color: COLOR.회의 };
  // 키워드 매칭 다 실패 → '기타'(미분류). acct=53001040 fallback 별도 처리 안 함.
  return { label: '기타', color: COLOR.기타 };
}

/** 카테고리 색상 — 도넛/트렌드 공유. 이모지 없음(라벨 텍스트만). */
export const COLOR: Record<PurposeLabel, string> = {
  취소: '#94a3b8',
  공용: '#6366f1',      // 인디고
  교통: '#3b82f6',      // 파랑
  점검: '#0ea5e9',      // 스카이
  야근: '#f97316',      // 진한 주황
  회식: '#ec4899',      // 분홍
  교육: '#14b8a6',      // 청록
  간담회: '#8b5cf6',    // 보라
  현업미팅: '#06b6d4',  // 시안
  팀원교류: '#84cc16',  // 라임
  회의: '#6C5CE7',      // 보라
  기타: '#94a3b8',      // 회색 (미분류)
};

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
