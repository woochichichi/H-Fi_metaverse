import { useMemo, useState } from 'react';
import { CreditCard, Loader2, Inbox, AlertTriangle, Clock } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import CorpCardKpiHeadline from '../dashboard/CorpCardKpiHeadline';
import CorpCardAccountList from '../dashboard/CorpCardAccountList';
import CorpCardMemberList from '../dashboard/CorpCardMemberList';
import CorpCardDailyChart from '../dashboard/CorpCardDailyChart';
import CorpCardQuarterChart from '../dashboard/CorpCardQuarterChart';
import CorpCardCategoryDonut from '../dashboard/CorpCardCategoryDonut';
import CorpCardCategoryTrend from '../dashboard/CorpCardCategoryTrend';
import CorpCardTopMerchants from '../dashboard/CorpCardTopMerchants';
import { useAuthStore } from '../../../stores/authStore';
import { useCorpCardLive } from '../../../hooks/useCorpCardLive';
import { useQuarterCompare } from '../../../hooks/useQuarterCompare';
import { useMyCardPending } from '../../../hooks/useMyCardPending';
import { fmt, fmtKR, pct } from '../../../lib/corpCardMockData';

const WARN_PCT = 60;
const DANGER_PCT = 80;

interface AlertItem {
  kind: 'danger' | 'warn' | 'info';
  title: string;
  desc: string;
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
  const { loading, error, snapshot, stats, transactions } = useCorpCardLive(team);
  const quarterCmp = useQuarterCompare(team);
  const myPending = useMyCardPending();

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
        });
      } else if (usedPct >= WARN_PCT) {
        list.push({
          kind: 'warn',
          title: `${a.shortName} 사용률 ${usedPct.toFixed(0)}%`,
          desc: '분기 중반 시점 정상 범위지만 추세를 살펴보세요.',
        });
      }
    });
    if (stats.burnPct > 110) {
      list.push({
        kind: 'warn',
        title: `이번 달 소진 페이스 +${(stats.burnPct - 100).toFixed(0)}%`,
        desc: `현재 페이스 유지 시 월말 ${fmtKR(stats.projectedMonth)} 도달 예상.`,
      });
    } else if (stats.burnPct < 70 && stats.burnPct > 0) {
      list.push({
        kind: 'info',
        title: '여유 있는 페이스',
        desc: `예상 대비 ${(100 - stats.burnPct).toFixed(0)}% 적게 사용 중. 계획된 회식·회의 일정 점검.`,
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
        actions={snapshot ? <SyncBadge capturedAt={snapshot.captured_at} periodYm={snapshot.period_ym} /> : undefined}
      />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !stats && <EmptyState />}

      {stats && snapshot && (
        <>
          {/* 1) Headline KPI */}
          <CorpCardKpiHeadline stats={stats} />

          {/* 2) 메인 2열 — 계정별 + 팀원별 */}
          <div className="w-cc-main-grid">
            <CorpCardAccountList accounts={stats.accounts} />
            <CorpCardMemberList activeMembers={stats.activeMembers} />
          </div>

          {/* 3) 일별 바차트 + 주의 알림 */}
          <div className="w-cc-main-grid">
            <CorpCardDailyChart
              dayMap={stats.dayMap}
              today={stats.daysElapsed}
              monthLabel={`${snapshot.period_ym.slice(0, 4)}.${snapshot.period_ym.slice(4, 6)}`}
              expectedByNow={stats.expectedByNow}
              monthUsed={stats.monthUsed}
              burnPct={stats.burnPct}
            />
            <AlertCard alerts={alerts} />
          </div>

          {/* 4) 분기 소진 흐름 + KPI 스트립 */}
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
            <div className="w-cc-q-strip">
              <div className="w-cc-q-cell">
                <div className="lbl">분기 누적 사용</div>
                <div className="val">{fmtKR(stats.totalUsed)}원</div>
                <div className="sub">편성 {fmtKR(stats.totalPlanned)}</div>
              </div>
              <div className="w-cc-q-cell">
                <div className="lbl">분기 잔여</div>
                <div className="val">{fmtKR(stats.totalRemaining)}원</div>
                <div className="sub">{pct(stats.totalUsed, stats.totalPlanned)}% 소진</div>
              </div>
              <div className="w-cc-q-cell">
                <div className="lbl">월말 예상</div>
                <div
                  className={`val${pct(stats.projectedMonth, stats.monthBudget) > 100 ? ' up' : ''}`}
                >
                  {fmtKR(stats.projectedMonth)}원
                </div>
                <div className="sub">월 예산 {pct(stats.projectedMonth, stats.monthBudget)}%</div>
              </div>
              <div className="w-cc-q-cell">
                <div className="lbl">분기말 예상</div>
                <div
                  className={`val${
                    stats.projectedQuarterPct > 100
                      ? ' up'
                      : stats.projectedQuarterPct > 90
                        ? ' warn'
                        : ' down'
                  }`}
                >
                  {fmtKR(stats.projectedQuarterEnd)}원
                </div>
                <div className="sub">편성 {stats.projectedQuarterPct.toFixed(0)}%</div>
              </div>
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

          {/* 6) 용도별 사용 비중 + 상위 사용처 — "사람 기준 아니라 용도 기준" */}
          <div className="w-cc-main-grid">
            <CorpCardCategoryDonut transactions={transactions} />
            <CorpCardTopMerchants transactions={transactions} limit={5} />
          </div>

          {/* 7) 용도별 일별 추이 */}
          <CorpCardCategoryTrend
            transactions={transactions}
            monthLabel={`${snapshot.period_ym.slice(0, 4)}.${snapshot.period_ym.slice(4, 6)}`}
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
        <div className="w-cc-card-title">
          ⚠️ 주의 알림 <span className="w-cc-count">{alerts.length}</span>
        </div>
      </div>
      <div className="w-cc-alert-list">
        {alerts.length === 0 ? (
          <div className="w-cc-empty">현재 주의가 필요한 항목이 없습니다 ✨</div>
        ) : (
          alerts.map((a, i) => (
            <div key={i} className={`w-cc-alert ${a.kind}`}>
              <div className="w-cc-alert-icon">
                {a.kind === 'danger' ? '🚨' : a.kind === 'warn' ? '⚠️' : 'ℹ️'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="w-cc-alert-title">{a.title}</div>
                <div className="w-cc-alert-desc">{a.desc}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
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
      {year} {quarter}분기 · 수집 {rel}
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
