import { useMemo, useState } from 'react';
import { CreditCard, Loader2, Inbox, AlertTriangle, Clock } from 'lucide-react';
import { Tip, HelpDot } from '../ui/Tip';
import PageHeader from '../ui/PageHeader';
import CorpCardSummaryHero from '../dashboard/CorpCardSummaryHero';
import CorpCardAccountList from '../dashboard/CorpCardAccountList';
import CorpCardMemberList from '../dashboard/CorpCardMemberList';
import CorpCardDailyChart from '../dashboard/CorpCardDailyChart';
import CorpCardQuarterChart from '../dashboard/CorpCardQuarterChart';
import CorpCardCategoryDonut from '../dashboard/CorpCardCategoryDonut';
import CorpCardCategoryTrend from '../dashboard/CorpCardCategoryTrend';
import { useAuthStore } from '../../../stores/authStore';
import { useCorpCardLive } from '../../../hooks/useCorpCardLive';
import { useQuarterCompare } from '../../../hooks/useQuarterCompare';
import { useMyCardPending } from '../../../hooks/useMyCardPending';
import { useCorpCardQuarters, quarterLabel } from '../../../hooks/useCorpCardQuarters';
import { usePlannedExpenses } from '../../../hooks/usePlannedExpenses';
import { fmt, fmtKR, pct } from '../../../lib/corpCardMockData';
import { formatKST } from '../../../lib/utils';
import PlannedExpenseSection from '../dashboard/PlannedExpenseSection';

const PRIVILEGED_ROLES = new Set(['admin', 'director', 'leader']);

const WARN_PCT = 60;
const DANGER_PCT = 80;

/** KST 기준 오늘 (YYYY-MM-DD). 일별 차트의 "오늘" 마커와 미래일 판별에 사용. */
function todayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** period_ym (예: "202604") → 분기 (1~4). */
function quarterOf(periodYm: string): number {
  const m = parseInt(periodYm.slice(4, 6), 10);
  return Math.ceil(m / 3);
}

interface AlertItem {
  kind: 'danger' | 'warn' | 'info';
  title: string;
  desc: string;
  /** 알림 발생 기준(hover tooltip) — 사용자가 "왜 이게 떴는지" 알 수 있게. */
  tooltip: string;
}

/**
 * 법인카드 현황 — 증권ITO 팀 전용 페이지.
 * cash/project 의 목업 구조를 본 페이지로 직접 포팅:
 *   1) Headline KPI 4열 (Hero + 3)
 *   2) 계정별 예산 (좌) + 팀원별 사용 (우) 2열
 *   3) 일별 소진 바차트 + 주의 알림 2열
 *   4) 분기 소진 흐름 SVG + KPI 스트립
 *   5) 본인 미처리 카드 패널
 *   6) 실시간 거래 피드 테이블
 *
 * 데이터: useCorpCardLive(snapshot 기반 stats), useCorpCardTrend(N일 추이),
 *        useMyCardPending(본인만 RLS).
 *
 * 접근: 사이드바에서 증권ITO만 보이지만 페이지 자체에서도 이중 방어.
 */
export default function CorpCardPage() {
  const profile = useAuthStore((s) => s.profile);

  console.log('[CorpCardPage] render', {
    hasProfile: !!profile,
    team: profile?.team,
    userId: profile?.id,
  });

  if (profile?.team !== '증권ITO') {
    return (
      <div style={{ padding: 24 }}>
        <PageHeader
          crumbs={[{ label: '한울타리' }, { label: '팀 예산' }]}
          title="팀 예산"
          description="이 페이지는 증권ITO 팀 소속자에게만 노출됩니다."
        />
        <div
          className="w-card"
          style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--w-text-muted)' }}
        >
          <CreditCard size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div style={{ fontSize: 13 }}>접근 권한이 없습니다.</div>
        </div>
      </div>
    );
  }

  return <CorpCardPageContent team={profile.team} />;
}

function CorpCardPageContent({ team }: { team: string }) {
  const profile = useAuthStore((s) => s.profile);
  // 분기 선택기 state — null 이면 가장 최근 분기 (default).
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const { quarters } = useCorpCardQuarters(team);
  const { loading, error, snapshot, stats, transactions } = useCorpCardLive(team, selectedPeriod);
  const quarterCmp = useQuarterCompare(team, selectedPeriod);
  const myPending = useMyCardPending();
  // 예정 지출 — 선택 분기 (또는 snapshot.period_ym) 기준
  const activePeriod = snapshot?.period_ym ?? selectedPeriod ?? null;
  const planned = usePlannedExpenses(team, activePeriod);

  // 항목 E: 일반 팀원은 팀원별 랭킹에서 본인 행만 표시.
  // 리더/관리자는 전체 열람 (팀장 피드백 260424 재확인 답변 기준).
  // 팀 집계·거래 분류 등 개인 식별 없는 지표는 role 무관 공개 유지.
  const isPrivileged = PRIVILEGED_ROLES.has(profile?.role ?? '');
  const visibleMembers = useMemo(() => {
    if (!stats) return [];
    if (isPrivileged) return stats.activeMembers;
    return stats.activeMembers.filter((m) => m.name === profile?.name);
  }, [stats, isPrivileged, profile?.name]);

  const alerts = useMemo<AlertItem[]>(() => {
    if (!stats) return [];
    const list: AlertItem[] = [];
    stats.accounts.forEach((a) => {
      if (a.planned <= 0) return;
      const usedPct = pct(a.used, a.planned);
      if (usedPct >= DANGER_PCT) {
        list.push({
          kind: 'danger',
          title: `${a.shortName} 잔여 ${(100 - usedPct).toFixed(0)}%`,
          desc: `예산 ${fmtKR(a.planned)} 중 ${fmtKR(a.used)} 사용. 남은 분기 동안 신중히 사용하세요.`,
          tooltip: `🚨 위험 알림: 계정 사용률 ${DANGER_PCT}% 이상일 때 발생.\n남은 분기 예산이 부족할 수 있어요.`,
        });
      } else if (usedPct >= WARN_PCT) {
        list.push({
          kind: 'warn',
          title: `${a.shortName} 사용률 ${usedPct.toFixed(0)}%`,
          desc: '분기 중반 시점 정상 범위지만 추세를 살펴보세요.',
          tooltip: `⚠️ 주의 알림: 계정 사용률 ${WARN_PCT}~${DANGER_PCT}% 일 때 발생.\n아직 위험은 아니지만 페이스를 점검하세요.`,
        });
      }
    });
    if (stats.burnPct > 110) {
      list.push({
        kind: 'warn',
        title: `이번 달 소진 페이스 +${(stats.burnPct - 100).toFixed(0)}%`,
        desc: `현재 페이스 유지 시 월말 ${fmtKR(stats.projectedMonth)} 도달 예상.`,
        tooltip: '⚠️ 페이스 알림: 이번 달 예상 소진 대비 +10% 이상 빠를 때 발생.\n현재 속도 유지 시 월간 예산을 초과할 수 있어요.',
      });
    } else if (stats.burnPct < 70 && stats.burnPct > 0) {
      list.push({
        kind: 'info',
        title: '여유 있는 페이스',
        desc: `예상 대비 ${(100 - stats.burnPct).toFixed(0)}% 적게 사용 중. 계획된 회식·회의 일정 점검.`,
        tooltip: 'ℹ️ 여유 알림: 이번 달 예상 소진 대비 30% 이상 적게 쓸 때 발생.\n계획된 회식·회의 일정이 미뤄지지 않았는지 확인해보세요.',
      });
    }

    // 그 외 모든 지표 정상이면 "정상" 카드를 1건 노출 — 빈 카드가 화면 차지하는 것보다
    // 긍정 시그널이 정보 밀도에 도움 (paceStatus 가 이미 계산돼 있으니 활용).
    if (list.length === 0 && stats.burnPct > 0) {
      list.push({
        kind: 'info',
        title: `${stats.paceDesc} · 소진 ${stats.burnPct.toFixed(0)}%`,
        desc: `이번 달 ${fmtKR(stats.monthUsed)} 사용 / 예상 ${fmtKR(stats.expectedByNow)}. 분기말 예상 ${stats.projectedQuarterPct.toFixed(0)}%.`,
        tooltip: 'ℹ️ 정상 알림: 위험·주의·여유 조건이 모두 안 걸리는 일반 상태.\n현재 페이스가 적정 범위 내라는 뜻이에요.',
      });
    }
    return list;
  }, [stats]);

  console.log('[CorpCardPageContent] render', {
    team,
    live: { loading, error, hasSnapshot: !!snapshot, hasStats: !!stats, txCount: transactions.length },
    quarter: { loading: quarterCmp.loading, error: quarterCmp.error, curPoints: quarterCmp.current?.points.length ?? 0, prevPoints: quarterCmp.previous?.points.length ?? 0, todayDay: quarterCmp.currentTodayDay },
    pending: { loading: myPending.loading, rows: myPending.rows.length },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        crumbs={[{ label: '한울타리' }, { label: '팀 예산' }]}
        title="팀 예산"
        description="우리 팀이 주로 어디에 쓰는지 한눈에 — 실시간 예산 사용 현황과 남은 버퍼를 확인하세요."
        actions={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <QuarterPicker
              quarters={quarters.map((q) => q.period_ym)}
              value={selectedPeriod ?? snapshot?.period_ym ?? null}
              onChange={(p) => setSelectedPeriod(p)}
            />
            {snapshot && <SyncBadge capturedAt={snapshot.captured_at} periodYm={snapshot.period_ym} />}
          </div>
        }
      />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !stats && <EmptyState />}

      {stats && snapshot && (
        <>
          {/* 1) Hero — "얼마 썼고/남았고" 한 줄 답 + 분기 안 월별 분포 chip */}
          <CorpCardSummaryHero
            stats={stats}
            transactions={transactions}
            periodYm={snapshot.period_ym}
            plannedTotal={planned.total}
          />

          {/* 2) 주로 어디에 (도넛 좌 + 내역 리스트 우) — 분기 전체 거래 기준 */}
          <CorpCardCategoryDonut transactions={transactions} />

          {/* 3) 계정별 예산 — 카테고리별 잔여 세부 (식대/회의/교통) */}
          <CorpCardAccountList accounts={stats.accounts} capturedAt={snapshot.captured_at} />

          {/* 4) 예정 지출 — 분기 말 회식·교육 등 미리 등록 (기존 합계와 분리) */}
          <PlannedExpenseSection
            periodYm={snapshot.period_ym}
            todayISO={todayISO()}
            planned={planned}
          />

          {/* 3) 일별 바차트(분기 90일) + 주의 알림 */}
          <div className="w-cc-main-grid">
            <CorpCardDailyChart
              dayMap={stats.dayMap}
              todayDate={todayISO()}
              quarterLabel={`${snapshot.period_ym.slice(0, 4)} ${quarterOf(snapshot.period_ym)}분기`}
              expectedByNow={stats.expectedByNow}
              monthUsed={stats.monthUsed}
              burnPct={stats.burnPct}
            />
            <AlertCard alerts={alerts} />
          </div>

          {/* 4) 분기 소진 흐름 — 전 분기 비교 (긴 시야).
                 KPI 스트립은 hero 와 중복돼 제거. 분기 차트는 추세 시각화 단독. */}
          <div className="w-cc-card">
            <div className="w-cc-card-head">
              <div className="w-cc-card-title">
                분기 소진 흐름
                {quarterCmp.current && quarterCmp.previous && (
                  <span className="w-cc-count">
                    {quarterCmp.previous.label} vs {quarterCmp.current.label}
                  </span>
                )}
              </div>
            </div>
            <div style={{ padding: '4px 12px 12px' }}>
              <CorpCardQuarterChart
                current={quarterCmp.current}
                previous={quarterCmp.previous}
                currentTodayDay={quarterCmp.currentTodayDay}
                loading={quarterCmp.loading}
              />
            </div>
          </div>

          {/* 5) 본인 미처리 카드 — 본인에게만 RLS로 보임 */}
          <MyPendingCard
            loading={myPending.loading}
            rows={myPending.rows}
            totalAmount={myPending.totalAmount}
            overdueRows={myPending.overdueRows}
            latestCapturedAt={myPending.latestCapturedAt}
          />

          {/* 6) 팀원별 사용 — 일반 팀원은 본인 행만 (RLS 아닌 프론트 필터, 한계는 docs/BUDGET.md 참조) */}
          <CorpCardMemberList
            activeMembers={visibleMembers}
            transactions={transactions}
            isPrivilegedView={isPrivileged}
          />

          {/* 7) 용도별 일별 추이 — 분기 전체 (도넛이 메인, 일별 분포는 패턴 확인용) */}
          <CorpCardCategoryTrend
            transactions={transactions}
            label={`${snapshot.period_ym.slice(0, 4)} ${quarterOf(snapshot.period_ym)}분기`}
          />
        </>
      )}
    </div>
  );
}

// ───── 보조 컴포넌트 ─────

function AlertCard({ alerts }: { alerts: AlertItem[] }) {
  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚠️ 주의 알림 <span className="w-cc-count">{alerts.length}</span>
          <HelpDot
            tip={
              <>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>알림 발생 기준</div>
                <div style={{ display: 'grid', gap: 4, fontSize: 11.5, lineHeight: 1.5 }}>
                  <div><b style={{ color: 'var(--w-danger)' }}>🚨 위험</b> · 계정 사용률 ≥ 80%</div>
                  <div><b style={{ color: 'var(--w-warning)' }}>⚠️ 주의</b> · 사용률 60~80% 또는 페이스 +10% 이상</div>
                  <div><b style={{ color: 'var(--w-info)' }}>ℹ️ 여유</b> · 페이스 −30% 이하</div>
                  <div><b style={{ color: 'var(--w-text-muted)' }}>ℹ️ 정상</b> · 위 조건 모두 미해당</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--w-text-muted)' }}>
                  각 알림에 마우스를 올리면 그 알림의 기준이 표시됩니다.
                </div>
              </>
            }
          />
        </div>
      </div>
      <div className="w-cc-alert-list">
        {alerts.length === 0 ? (
          <div className="w-cc-empty">현재 주의가 필요한 항목이 없습니다 ✨</div>
        ) : (
          alerts.map((a, i) => (
            <Tip key={i} content={a.tooltip}>
              <div className={`w-cc-alert ${a.kind}`} style={{ cursor: 'help' }}>
                <div className="w-cc-alert-icon">
                  {a.kind === 'danger' ? '🚨' : a.kind === 'warn' ? '⚠️' : 'ℹ️'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="w-cc-alert-title">{a.title}</div>
                  <div className="w-cc-alert-desc">{a.desc}</div>
                </div>
              </div>
            </Tip>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 분기 선택기 — 페이지 상단에서 전체 차트·표·hero 동기화.
 * DB 에 데이터가 있는 분기만 노출 (useCorpCardQuarters 결과).
 */
function QuarterPicker({
  quarters,
  value,
  onChange,
}: {
  quarters: string[];
  value: string | null;
  onChange: (p: string | null) => void;
}) {
  if (quarters.length === 0) return null;
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid var(--w-border)',
        background: 'var(--w-surface)',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--w-text)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
      title="분기 변경"
    >
      {quarters.map((p) => (
        <option key={p} value={p}>
          {quarterLabel(p)}
        </option>
      ))}
    </select>
  );
}

function SyncBadge({ capturedAt, periodYm }: { capturedAt: string; periodYm: string }) {
  // 마운트 시점의 now를 한 번만 캡처 — 렌더 순수성 유지 (react-hooks/purity)
  const [now] = useState<number>(() => Date.now());
  const d = new Date(capturedAt);
  const diffMin = Math.max(0, Math.floor((now - d.getTime()) / 60000));
  const rel =
    diffMin < 1
      ? '방금'
      : diffMin < 60
        ? `${diffMin}분 전`
        : diffMin < 60 * 24
          ? `${Math.floor(diffMin / 60)}시간 전`
          : `${Math.floor(diffMin / (60 * 24))}일 전`;
  const stale = diffMin > 60 * 24 * 2;
  const year = periodYm.slice(0, 4);
  const month = parseInt(periodYm.slice(4, 6), 10);
  const quarter = Math.ceil(month / 3);
  // MM/DD HH:mm KST 포맷 — Asia/Seoul timezone 강제
  const exact = formatKST(d);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        background: stale ? 'var(--w-urgency-todo-soft)' : 'var(--w-accent-soft)',
        color: stale ? 'var(--w-urgency-todo)' : 'var(--w-accent-hover)',
        fontSize: 11.5,
        fontWeight: 600,
      }}
      title={`수집 시각: ${d.toLocaleString('ko-KR')}`}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: stale ? 'var(--w-urgency-todo)' : 'var(--w-accent-hover)',
          boxShadow: stale ? 'none' : '0 0 0 3px var(--w-accent-soft)',
        }}
      />
      {year} {quarter}분기 · {exact} 수집 ({rel})
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-cc-card" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--w-text-muted)' }}>
      <Loader2 size={18} style={{ animation: 'v2Shimmer 1.2s linear infinite' }} />
      <div style={{ fontSize: 13, marginTop: 8 }}>팀 예산 데이터를 불러오는 중…</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="w-cc-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--w-urgency-critical)', marginBottom: 4 }}>
        팀 예산 데이터를 불러오지 못했어요
      </div>
      <div style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>{message}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-cc-card" style={{ padding: '32px 20px', textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 999,
          background: 'var(--w-surface-2)',
          marginBottom: 10,
        }}
      >
        <Inbox size={20} color="var(--w-text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-text)' }}>
        이번 달 사용 내역이 없어요
      </div>
      <div style={{ fontSize: 12, color: 'var(--w-text-muted)', marginTop: 6 }}>
        매일 오전 7시에 자동 수집됩니다. 첫 수집이 완료되면 이곳에 현황이 표시돼요.
      </div>
    </div>
  );
}

interface MyPendingProps {
  loading: boolean;
  rows: ReturnType<typeof useMyCardPending>['rows'];
  totalAmount: number;
  overdueRows: ReturnType<typeof useMyCardPending>['overdueRows'];
  latestCapturedAt: string | null;
}

function MyPendingCard({
  loading,
  rows,
  totalAmount,
  overdueRows,
  latestCapturedAt,
}: MyPendingProps) {
  // 마운트 시점의 now를 한 번만 캡처 — 렌더 순수성 유지 (react-hooks/purity)
  const [now] = useState<number>(() => Date.now());
  if (loading) return null;
  if (!latestCapturedAt) return null;
  if (rows.length === 0) return null;
  const hasOverdue = overdueRows.length > 0;

  return (
    <div className="w-cc-card">
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--w-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: hasOverdue ? 'var(--w-urgency-todo-soft)' : 'var(--w-accent-soft)',
        }}
      >
        <Clock size={14} color={hasOverdue ? 'var(--w-urgency-todo)' : 'var(--w-accent-hover)'} />
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)', flex: 1 }}>
          내 미처리 카드 · {rows.length}건 · {fmt(totalAmount)}원
        </div>
        {hasOverdue && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 8px',
              background: 'var(--w-urgency-todo)',
              color: '#fff',
              borderRadius: 999,
            }}
          >
            <AlertTriangle size={10} style={{ verticalAlign: -1, marginRight: 3 }} />
            72h 경과 {overdueRows.length}건
          </span>
        )}
        <span style={{ fontSize: 10.5, color: 'var(--w-text-muted)', fontWeight: 500 }}>
          나에게만 보임
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="w-cc-tx-table">
          <thead>
            <tr>
              <th>승인일</th>
              <th>가맹점</th>
              <th>카드</th>
              <th style={{ textAlign: 'right' }}>금액</th>
              <th>경과</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const over =
                r.add_date && now - new Date(r.add_date).getTime() > 72 * 60 * 60 * 1000;
              const days = r.add_date
                ? Math.floor((now - new Date(r.add_date).getTime()) / (24 * 60 * 60 * 1000))
                : 0;
              return (
                <tr key={r.id}>
                  <td className="w-cc-tx-date">{r.add_date?.slice(5) ?? '—'}</td>
                  <td>{r.store_name ?? '—'}</td>
                  <td className="w-cc-tx-date">{r.card_last4 ? `****${r.card_last4}` : '—'}</td>
                  <td className="w-cc-tx-amt">{fmt(r.amount)}</td>
                  <td>
                    <span
                      style={{
                        fontSize: 10.5,
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: over ? 'var(--w-urgency-todo-soft)' : 'var(--w-surface-2)',
                        color: over ? 'var(--w-urgency-todo)' : 'var(--w-text-muted)',
                        fontWeight: 700,
                      }}
                    >
                      {days}일
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
