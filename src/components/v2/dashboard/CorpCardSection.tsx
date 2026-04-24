import { useMemo } from 'react';
import { CreditCard, Wallet, Flame, TrendingUp, Loader2, Inbox, AlertTriangle, Clock, Activity } from 'lucide-react';
import {
  classifyTransaction,
  fmt,
  fmtKR,
  fmtKRDecimal,
  pct,
  avatarColor,
  initial,
  type CorpTransaction,
} from '../../../lib/corpCardMockData';
import { useCorpCardLive } from '../../../hooks/useCorpCardLive';
import { useMyCardPending, type MyCardPendingRow } from '../../../hooks/useMyCardPending';
import { useCorpCardTrend, type TrendPoint } from '../../../hooks/useCorpCardTrend';

const WARN_PCT = 80;
const DANGER_PCT = 90;

interface Props {
  team: string;
}

/**
 * 법인카드 현황 섹션 — 대시보드 하단에 추가되는 종합 위젯.
 * 데이터 소스: Supabase corp_card_* 테이블 (cash/automation 이 매일 업로드).
 * 수집 전이면 빈 상태 UI 노출.
 */
export default function CorpCardSection({ team }: Props) {
  const { loading, error, snapshot, stats, transactions } = useCorpCardLive(team);
  const myPending = useMyCardPending();
  const trend = useCorpCardTrend(team, 14);

  console.log('[CorpCardSection] render', {
    team,
    live: { loading, error, hasSnapshot: !!snapshot, hasStats: !!stats, txCount: transactions.length },
    myPending: { loading: myPending.loading, error: myPending.error, rowCount: myPending.rows.length },
    trend: { loading: trend.loading, error: trend.error, points: trend.points.length },
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!snapshot || !stats) return <EmptyState />;

  const {
    accounts,
    totalPlanned,
    totalUsed,
    totalRemaining,
    activeMembers,
    dayMap,
    monthBudget,
    monthUsed,
    monthRemaining,
    expectedByNow,
    burnPct,
    projectedMonth,
    projectedQuarterPct,
    daysElapsed,
    weeksRemaining,
    weeklyAvailable,
    paceStatus,
    paceDesc,
    lastMonthTotal,
    monthDelta,
  } = stats;

  const txAll = transactions;
  const totalUsedPct = pct(totalUsed, totalPlanned);
  const maxMember = Math.max(...activeMembers.map((m) => m.used), 1);
  const recentTx = useMemo(
    () => [...txAll].sort((a, b) => (b.regDate || '').localeCompare(a.regDate || '')).slice(0, 8),
    [txAll],
  );

  // 표시용 메타
  const year = parseInt(snapshot.period_ym.slice(0, 4), 10);
  const month = parseInt(snapshot.period_ym.slice(4, 6), 10);
  const quarter = Math.ceil(month / 3);

  const paceTone =
    paceStatus === 'danger'
      ? 'var(--w-urgency-critical)'
      : paceStatus === 'warn'
        ? 'var(--w-urgency-todo)'
        : paceStatus === 'info'
          ? 'var(--w-urgency-info)'
          : 'var(--w-accent-hover)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 섹션 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <CreditCard size={16} color="var(--w-accent-hover)" />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--w-text)' }}>법인카드 현황</h2>
            <span className="w-badge w-badge-muted" style={{ fontSize: 10 }}>
              {snapshot.dept_cd} · {year} {quarter}분기
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>
            현재 사용현황과 남은 버퍼를 한눈에 확인하세요
          </div>
        </div>
        <SyncBadge capturedAt={snapshot.captured_at} />
      </div>

      {/* 예산 임계치 경보 — 80/90 % */}
      <ThresholdAlerts accounts={accounts} />

      {/* 본인 미처리 카드 — 본인 프로필만 데이터 받음 (RLS) */}
      <MyPendingPanel
        loading={myPending.loading}
        rows={myPending.rows}
        totalAmount={myPending.totalAmount}
        overdueRows={myPending.overdueRows}
        latestCapturedAt={myPending.latestCapturedAt}
      />

      {/* KPI 4개 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        <KpiTile
          Icon={Wallet}
          label="분기 총 잔여 예산"
          value={`${fmtKRDecimal(totalRemaining)}원`}
          sub={
            <>
              편성 {fmtKR(totalPlanned)} 중 <strong>{totalUsedPct}%</strong> 사용 · 분기말 예상 {projectedQuarterPct.toFixed(0)}%
            </>
          }
          progress={totalUsedPct}
          tone={paceTone}
          tagText={paceDesc}
        />
        <KpiTile
          Icon={Wallet}
          label="이번 주 가용"
          value={`${fmtKR(Math.max(0, weeklyAvailable))}원/주`}
          sub={`월 잔여 ${fmtKR(Math.max(0, monthRemaining))} · 남은 ${weeksRemaining.toFixed(1)}주`}
          tone="var(--w-accent-hover)"
        />
        <KpiTile
          Icon={Flame}
          label="소진 페이스"
          value={`${burnPct.toFixed(0)}%`}
          sub={
            <>
              예상 대비 {burnPct > 100 ? '+' : ''}
              {(burnPct - 100).toFixed(0)}%
              {lastMonthTotal > 0 && ` · 지난달 ${monthDelta > 0 ? '+' : ''}${monthDelta.toFixed(0)}%`}
            </>
          }
          tone={burnPct > 110 ? 'var(--w-urgency-critical)' : burnPct < 70 ? 'var(--w-urgency-info)' : 'var(--w-accent-hover)'}
        />
        <KpiTile
          Icon={TrendingUp}
          label="월말 예상치"
          value={`${fmtKR(projectedMonth)}원`}
          sub={`월 예산 ${fmtKR(monthBudget)} 기준 ${pct(projectedMonth, monthBudget)}%`}
          tone={pct(projectedMonth, monthBudget) > 100 ? 'var(--w-urgency-critical)' : 'var(--w-accent-hover)'}
        />
      </div>

      {/* 메인 2열: 계정별 예산 + 팀원별 사용 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {/* 계정별 예산 */}
        <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
          <SectionHeader title="계정별 예산" count={accounts.length} />
          <div style={{ padding: '4px 0 8px' }}>
            {accounts.map((a) => {
              const usedPct = pct(a.used, a.planned);
              return (
                <div
                  key={a.code}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 12,
                    padding: '12px 16px',
                    alignItems: 'center',
                    borderTop: '1px solid var(--w-border)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--w-radius-sm)',
                      background: 'var(--w-surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    {a.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{a.shortName}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono, monospace)' }}>
                      {a.code} · {a.name}
                    </div>
                    <StackedProgress saved={a.saved} pending={a.pending} completed={a.completed} total={a.planned} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--w-text-muted)' }}>
                      <span>{usedPct}% 사용</span>
                      <span>
                        완료 {fmt(a.completed)} · 처리중 {fmt(a.pending)}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)' }}>잔여</div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: usedPct > 80 ? 'var(--w-urgency-critical)' : 'var(--w-text)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {fmt(a.remaining)}원
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)', marginTop: 2 }}>예산 {fmt(a.planned)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 팀원별 사용 */}
        <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
          <SectionHeader title="팀원별 사용" count={`${activeMembers.length}`} />
          <div style={{ padding: '4px 0 8px' }}>
            {activeMembers.map((m, i) => (
              <div
                key={m.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto 1fr auto',
                  gap: 10,
                  padding: '10px 16px',
                  alignItems: 'center',
                  borderTop: '1px solid var(--w-border)',
                }}
              >
                <div
                  style={{
                    minWidth: 20,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: i < 3 ? 'var(--w-accent-hover)' : 'var(--w-text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: avatarColor(m.name),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {initial(m.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--w-text)' }}>{m.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)' }}>
                    {m.count}건 · 카드 ****{m.cardLast4}
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: 'var(--w-surface-2)',
                      marginTop: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${(m.used / maxMember) * 100}%`,
                        height: '100%',
                        background: 'var(--w-accent)',
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--w-text)',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 50,
                    textAlign: 'right',
                  }}
                >
                  {fmtKR(m.used)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 14일 추이 — 수집 snapshot 누적 기반 */}
      <TrendSection points={trend.points} loading={trend.loading} dodChangePct={trend.dodChangePct} />

      {/* 일별 소진 추이 */}
      <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader
          title="일별 소진 추이"
          count={`${year}.${String(month).padStart(2, '0')}`}
          right={
            <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: 'var(--w-text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: 'var(--w-accent)', borderRadius: 2 }} />
                실제
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: 'var(--w-urgency-todo)', borderRadius: 2 }} />
                초과
              </span>
            </div>
          }
        />
        <DailyBars dayMap={dayMap} today={daysElapsed} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 16px',
            fontSize: 11.5,
            color: 'var(--w-text-muted)',
            borderTop: '1px solid var(--w-border)',
          }}
        >
          <span>예상 페이스: {fmt(expectedByNow)}원</span>
          <span>
            실제:{' '}
            <strong
              style={{
                color:
                  burnPct > 110
                    ? 'var(--w-urgency-critical)'
                    : burnPct < 90
                      ? 'var(--w-accent-hover)'
                      : 'var(--w-text)',
              }}
            >
              {fmt(monthUsed)}원
            </strong>{' '}
            ({burnPct.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* 최근 거래 피드 */}
      <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader title="최근 거래" count={txAll.length} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--w-surface-2)' }}>
                <Th>등록일</Th>
                <Th>사용자</Th>
                <Th>카테고리</Th>
                <Th>적요</Th>
                <Th align="right">금액</Th>
                <Th>상태</Th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((t) => (
                <TxRow key={t.no} tx={t} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───── 하위 컴포넌트 ─────

function SectionHeader({
  title,
  count,
  right,
}: {
  title: string;
  count?: number | string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--w-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{title}</div>
        {count !== undefined && (
          <span
            style={{
              fontSize: 10.5,
              padding: '2px 7px',
              background: 'var(--w-surface-2)',
              color: 'var(--w-text-muted)',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {count}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

function KpiTile({
  Icon,
  label,
  value,
  sub,
  progress,
  tone,
  tagText,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  sub: React.ReactNode;
  progress?: number;
  tone: string;
  tagText?: string;
}) {
  return (
    <div className="w-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} color={tone} />
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--w-text-soft)' }}>{label}</div>
        {tagText && (
          <span style={{ fontSize: 10, color: tone, marginLeft: 'auto', fontWeight: 700 }}>{tagText}</span>
        )}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--w-text)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      {progress !== undefined && (
        <div style={{ height: 4, background: 'var(--w-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, progress)}%`,
              height: '100%',
              background: tone,
              transition: 'width 0.4s',
            }}
          />
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>{sub}</div>
    </div>
  );
}

function StackedProgress({
  saved,
  pending,
  completed,
  total,
}: {
  saved: number;
  pending: number;
  completed: number;
  total: number;
}) {
  const wc = total === 0 ? 0 : (completed / total) * 100;
  const wp = total === 0 ? 0 : (pending / total) * 100;
  const ws = total === 0 ? 0 : (saved / total) * 100;
  return (
    <div
      style={{
        display: 'flex',
        height: 6,
        background: 'var(--w-surface-2)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <span style={{ width: `${wc}%`, height: '100%', background: 'var(--w-accent)' }} title={`완료 ${fmt(completed)}원`} />
      <span style={{ width: `${wp}%`, height: '100%', background: 'var(--w-urgency-todo)', opacity: 0.75 }} title={`처리중 ${fmt(pending)}원`} />
      <span style={{ width: `${ws}%`, height: '100%', background: 'var(--w-urgency-info)', opacity: 0.5 }} title={`저장 ${fmt(saved)}원`} />
    </div>
  );
}

function DailyBars({ dayMap, today }: { dayMap: Record<string, number>; today: number }) {
  const entries = Object.entries(dayMap);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, padding: '16px 16px 6px', gap: 3 }}>
      {entries.map(([date, val]) => {
        const day = parseInt(date.split('-')[2], 10);
        const isFuture = day > today;
        const h = isFuture ? 0 : val === 0 ? 2 : Math.max(4, (val / max) * 100);
        const isHigh = val > max * 0.7;
        return (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <div
              style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              {!isFuture && val > 0 && (
                <div
                  title={`${date} · ${fmt(val)}원`}
                  style={{
                    height: `${h}%`,
                    background: isHigh ? 'var(--w-urgency-todo)' : 'var(--w-accent)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.4s',
                  }}
                />
              )}
              {isFuture && (
                <div
                  style={{
                    height: '2%',
                    background: 'var(--w-surface-2)',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontSize: 9,
                color: day === today ? 'var(--w-accent-hover)' : 'var(--w-text-muted)',
                fontWeight: day === today ? 700 : 500,
                marginTop: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {day}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        padding: '10px 12px',
        textAlign: align,
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--w-text-muted)',
        borderBottom: '1px solid var(--w-border)',
      }}
    >
      {children}
    </th>
  );
}

function TxRow({ tx }: { tx: CorpTransaction }) {
  const cat = classifyTransaction(tx.memo);
  const catTone =
    cat.account === '53401010'
      ? 'var(--w-urgency-info)'
      : cat.account === '53405010'
        ? 'var(--w-accent-hover)'
        : 'var(--w-urgency-todo)';
  const catBg =
    cat.account === '53401010'
      ? 'var(--w-urgency-info-soft)'
      : cat.account === '53405010'
        ? 'var(--w-accent-soft)'
        : 'var(--w-urgency-todo-soft)';
  return (
    <tr style={{ borderBottom: '1px solid var(--w-border)' }}>
      <Td muted>{tx.regDate.slice(5)}</Td>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: avatarColor(tx.user),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {initial(tx.user)}
          </div>
          <span style={{ fontSize: 12 }}>{tx.user}</span>
        </div>
      </Td>
      <Td>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 999,
            background: catBg,
            color: catTone,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {cat.icon} {cat.label}
        </span>
      </Td>
      <Td>
        <div
          style={{
            maxWidth: 360,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 12,
            color: 'var(--w-text-soft)',
          }}
          title={tx.memo}
        >
          {tx.memo}
        </div>
      </Td>
      <Td align="right">
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(tx.amount)}</span>
      </Td>
      <Td>
        <span
          className={`w-badge ${tx.status === '승인' ? 'w-badge-info' : tx.status === '처리중' ? 'w-badge-todo' : 'w-badge-muted'}`}
          style={{ fontSize: 10 }}
        >
          {tx.status}
        </span>
      </Td>
    </tr>
  );
}

function Td({
  children,
  align = 'left',
  muted,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  muted?: boolean;
}) {
  return (
    <td
      style={{
        padding: '10px 12px',
        textAlign: align,
        fontSize: 12,
        color: muted ? 'var(--w-text-muted)' : 'var(--w-text)',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
}

// ───── 상태 UI ─────

function SyncBadge({ capturedAt }: { capturedAt: string }) {
  const d = new Date(capturedAt);
  const diffMin = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  const rel =
    diffMin < 1 ? '방금'
    : diffMin < 60 ? `${diffMin}분 전`
    : diffMin < 60 * 24 ? `${Math.floor(diffMin / 60)}시간 전`
    : `${Math.floor(diffMin / (60 * 24))}일 전`;
  const abs = d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const stale = diffMin > 60 * 24 * 2;

  return (
    <div
      title={`수집 시각: ${abs}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        background: stale ? 'var(--w-urgency-todo-soft)' : 'var(--w-accent-soft)',
        color: stale ? 'var(--w-urgency-todo)' : 'var(--w-accent-hover)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6, height: 6, borderRadius: 999,
          background: stale ? 'var(--w-urgency-todo)' : 'var(--w-accent-hover)',
          boxShadow: stale ? 'none' : '0 0 0 3px var(--w-accent-soft)',
        }}
      />
      최근 수집 {rel}
      <span style={{ opacity: 0.7, fontWeight: 500, marginLeft: 2 }}>· {abs}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-card" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--w-text-muted)' }}>
      <Loader2 size={18} style={{ animation: 'v2Shimmer 1.2s linear infinite' }} />
      <div style={{ fontSize: 13, marginTop: 8 }}>법인카드 데이터를 불러오는 중…</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="w-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--w-urgency-critical)', marginBottom: 4 }}>
        법인카드 데이터를 불러오지 못했어요
      </div>
      <div style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>{message}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-card" style={{ padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 44, height: 44, borderRadius: 999, background: 'var(--w-surface-2)', marginBottom: 10 }}>
        <Inbox size={20} color="var(--w-text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-text)' }}>
        아직 수집된 법인카드 데이터가 없어요
      </div>
      <div style={{ fontSize: 12, color: 'var(--w-text-muted)', marginTop: 6 }}>
        매일 오전 7시에 자동 수집됩니다. 첫 수집이 완료되면 이곳에 현황이 표시돼요.
      </div>
    </div>
  );
}

// ───── 경보 · 본인 · 추이 ─────

function ThresholdAlerts({
  accounts,
}: {
  accounts: { name: string; shortName: string; planned: number; used: number }[];
}) {
  const alerts = accounts
    .filter((a) => a.planned > 0)
    .map((a) => {
      const p = pct(a.used, a.planned);
      const level: 'danger' | 'warn' | null = p >= DANGER_PCT ? 'danger' : p >= WARN_PCT ? 'warn' : null;
      return { ...a, usedPct: p, level };
    })
    .filter((a) => a.level);

  if (alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a: any) => {
        const isDanger = a.level === 'danger';
        const bg = isDanger ? 'var(--w-urgency-critical-soft)' : 'var(--w-urgency-todo-soft)';
        const fg = isDanger ? 'var(--w-urgency-critical)' : 'var(--w-urgency-todo)';
        return (
          <div
            key={a.shortName}
            className="w-card"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', background: bg, border: `1px solid ${fg}`,
            }}
          >
            <AlertTriangle size={16} color={fg} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: fg }}>
                {a.shortName} · {a.usedPct.toFixed(0)}% 소진
                {isDanger ? ' — 초과 임박' : ' — 주의'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--w-text-muted)' }}>
                편성 {fmtKR(a.planned)} 중 {fmtKR(a.used)} 사용 ·
                분기말까지 남은 예산 집행 속도 조절 필요
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MyPendingPanel({
  loading, rows, totalAmount, overdueRows, latestCapturedAt,
}: {
  loading: boolean;
  rows: MyCardPendingRow[];
  totalAmount: number;
  overdueRows: MyCardPendingRow[];
  latestCapturedAt: string | null;
}) {
  if (loading) return null;                  // 데이터 없으면 아무것도 안 보이는 게 자연스러움
  if (!latestCapturedAt) return null;
  if (rows.length === 0) return null;        // 미처리 0건이면 감춰서 깔끔하게

  const hasOverdue = overdueRows.length > 0;

  return (
    <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 16px', borderBottom: '1px solid var(--w-border)',
          display: 'flex', alignItems: 'center', gap: 10,
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
              fontSize: 10.5, fontWeight: 700, padding: '3px 8px',
              background: 'var(--w-urgency-todo)', color: '#fff', borderRadius: 999,
            }}
          >
            72h 경과 {overdueRows.length}건
          </span>
        )}
        <span style={{ fontSize: 10.5, color: 'var(--w-text-muted)', fontWeight: 500 }}>
          나에게만 보임
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--w-surface-2)' }}>
              <Th>승인일</Th>
              <Th>가맹점</Th>
              <Th>카드</Th>
              <Th align="right">금액</Th>
              <Th>경과</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const over = r.add_date && Date.now() - new Date(r.add_date).getTime() > 72 * 60 * 60 * 1000;
              const days = r.add_date ? Math.floor((Date.now() - new Date(r.add_date).getTime()) / (24 * 60 * 60 * 1000)) : 0;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--w-border)' }}>
                  <Td muted>{r.add_date?.slice(5) ?? '—'}</Td>
                  <Td>{r.store_name ?? '—'}</Td>
                  <Td muted>{r.card_last4 ? `****${r.card_last4}` : '—'}</Td>
                  <Td align="right">
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(r.amount)}</span>
                  </Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 10.5, padding: '2px 7px', borderRadius: 999,
                        background: over ? 'var(--w-urgency-todo-soft)' : 'var(--w-surface-2)',
                        color: over ? 'var(--w-urgency-todo)' : 'var(--w-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {days}일
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendSection({ points, loading, dodChangePct }: {
  points: TrendPoint[];
  loading: boolean;
  dodChangePct: number | null;
}) {
  if (loading) return null;
  if (points.length < 2) return null;

  const maxUsed = Math.max(...points.map((p) => p.totalUsed), 1);
  const W = 100; // viewBox width %
  const H = 60;
  const step = W / (points.length - 1);

  const linePts = points.map((p, i) => `${(i * step).toFixed(2)},${(H - (p.totalUsed / maxUsed) * H).toFixed(2)}`).join(' ');
  const areaPts = `0,${H} ${linePts} ${W},${H}`;
  const latest = points[points.length - 1];

  return (
    <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
      <SectionHeader
        title="소진 추이"
        count={`${points.length}일`}
        right={
          dodChangePct != null ? (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                color: dodChangePct > 0 ? 'var(--w-urgency-todo)' : 'var(--w-accent-hover)',
              }}
            >
              <Activity size={12} />
              전일 대비 {dodChangePct > 0 ? '+' : ''}{dodChangePct.toFixed(1)}%
            </span>
          ) : null
        }
      />
      <div style={{ padding: '12px 16px' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="140" preserveAspectRatio="none">
          <polygon points={areaPts} fill="var(--w-accent)" opacity="0.12" />
          <polyline points={linePts} fill="none" stroke="var(--w-accent)" strokeWidth="0.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--w-text-muted)', marginTop: 6 }}>
          <span>{points[0].date.slice(5)}</span>
          <span>최신 {fmtKR(latest.totalUsed)} / 편성 {fmtKR(latest.totalPlanned)}</span>
          <span>{latest.date.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}
