import { fmt, fmtKR, fmtKRDecimal, pct, type DashboardStats } from '../../../lib/corpCardMockData';

interface Props {
  stats: DashboardStats;
}

/**
 * 헤드라인 KPI 4열 — 분기 잔여(Hero) + 주간 가용 + 소진 페이스 + 월말 예상치.
 * cash/project/app.jsx 의 .headline 그리드 포팅.
 */
export default function CorpCardKpiHeadline({ stats }: Props) {
  const {
    totalPlanned,
    totalUsed,
    totalRemaining,
    monthBudget,
    monthRemaining,
    weeklyAvailable,
    weeksRemaining,
    burnPct,
    projectedMonth,
    projectedQuarterPct,
    paceDesc,
    paceStatus,
    lastMonthTotal,
    monthDelta,
  } = stats;

  const totalUsedPct = pct(totalUsed, totalPlanned);
  const projectedMonthPct = pct(projectedMonth, monthBudget);

  const paceLabelTone =
    paceStatus === 'danger'
      ? 'var(--w-urgency-critical)'
      : paceStatus === 'warn'
        ? 'var(--w-urgency-todo)'
        : paceStatus === 'info'
          ? 'var(--w-urgency-info)'
          : 'var(--w-success)';

  return (
    <div className="w-cc-headline">
      {/* Hero — 분기 총 잔여 */}
      <div className="w-cc-kpi w-cc-kpi-hero">
        <div className="w-cc-kpi-label">
          분기 총 잔여 예산 · <span style={{ color: paceLabelTone, fontWeight: 700 }}>{paceDesc}</span>
        </div>
        <div className="w-cc-kpi-value">
          {fmtKRDecimal(totalRemaining)}
          <span className="unit">원</span>
        </div>
        <div className="w-cc-progress">
          <div className="w-cc-progress-fill" style={{ width: `${Math.min(100, totalUsedPct)}%` }} />
        </div>
        <div className="w-cc-kpi-sub">
          편성 {fmtKR(totalPlanned)} 중 <strong style={{ color: 'inherit' }}>{totalUsedPct}%</strong> 사용 ·
          분기말 예상 {projectedQuarterPct.toFixed(0)}%
        </div>
      </div>

      {/* 이번 주 가용 */}
      <div className="w-cc-kpi">
        <div className="w-cc-kpi-label">💰 이번 주 가용</div>
        <div
          className="w-cc-kpi-value"
          style={{ color: weeklyAvailable < 0 ? 'var(--w-urgency-critical)' : 'var(--w-text)' }}
        >
          {fmtKR(Math.max(0, weeklyAvailable))}
          <span className="unit">원/주</span>
        </div>
        <div className="w-cc-kpi-sub">
          월 잔여 {fmtKR(Math.max(0, monthRemaining))} · 남은 {weeksRemaining.toFixed(1)}주
        </div>
      </div>

      {/* 소진 페이스 */}
      <div className="w-cc-kpi">
        <div className="w-cc-kpi-label">🔥 소진 페이스</div>
        <div className="w-cc-kpi-value">
          {burnPct.toFixed(0)}
          <span className="unit">%</span>
        </div>
        <div className="w-cc-kpi-sub">
          <span className={`w-cc-delta ${burnPct > 100 ? 'w-cc-delta-up' : 'w-cc-delta-down'}`}>
            {burnPct > 100 ? '↑' : '↓'} {Math.abs(burnPct - 100).toFixed(0)}%
          </span>
          예상 페이스 대비
          {lastMonthTotal > 0 && (
            <> · 지난달 {monthDelta > 0 ? '+' : ''}{monthDelta.toFixed(0)}%</>
          )}
        </div>
      </div>

      {/* 월말 예상치 */}
      <div className="w-cc-kpi">
        <div className="w-cc-kpi-label">📈 월말 예상치</div>
        <div
          className="w-cc-kpi-value"
          style={{ color: projectedMonthPct > 100 ? 'var(--w-urgency-critical)' : 'var(--w-text)' }}
        >
          {fmt(projectedMonth)}
          <span className="unit">원</span>
        </div>
        <div className="w-cc-kpi-sub">
          월 예산 {fmtKR(monthBudget)} 기준 {projectedMonthPct}%
        </div>
      </div>
    </div>
  );
}
