import { fmtKR, pct, type DashboardStats } from '../../../lib/corpCardMockData';

interface Props {
  stats: DashboardStats;
}

/**
 * 팀 예산 페이지의 단일 Hero — "얼마 썼고 / 얼마 남았고" 한 줄 답.
 * 분기 단위가 회계 편성 단위라 메인 숫자는 분기로, 이번 달·주·분기말 예상은 chip 으로 보조.
 * 옆에 CorpCardCategoryDonut 가 "어디에" 답을 책임짐.
 */
export default function CorpCardSummaryHero({ stats }: Props) {
  const usedPct = pct(stats.totalUsed, stats.totalPlanned);
  const monthUsedPct = pct(stats.monthUsed, stats.monthBudget);

  const paceTone =
    stats.paceStatus === 'danger'
      ? 'var(--w-urgency-critical)'
      : stats.paceStatus === 'warn'
        ? 'var(--w-urgency-todo)'
        : stats.paceStatus === 'info'
          ? 'var(--w-urgency-info)'
          : 'var(--w-success)';

  const qProjLabel =
    stats.projectedQuarterPct > 100
      ? '초과 위험'
      : stats.projectedQuarterPct > 90
        ? '여유 부족'
        : stats.projectedQuarterPct < 60
          ? '미소진 위험'
          : '양호';

  return (
    <div className="w-cc-hero">
      <div className="w-cc-hero-head">이번 분기 예산</div>

      <div className="w-cc-hero-numbers">
        <div className="w-cc-hero-stat">
          <div className="lbl">사용</div>
          <div className="val">
            {fmtKR(stats.totalUsed)}<span className="unit">원</span>
          </div>
        </div>
        <div className="w-cc-hero-divider" aria-hidden />
        <div className="w-cc-hero-stat alt">
          <div className="lbl">남은 예산</div>
          <div className="val">
            {fmtKR(stats.totalRemaining)}<span className="unit">원</span>
          </div>
        </div>
      </div>

      <div className="w-cc-hero-progress">
        <div className="bar">
          <div className="fill" style={{ width: `${Math.min(100, usedPct)}%` }} />
        </div>
        <div className="meta">
          <span>
            <strong>{usedPct}%</strong> 소진 · 편성 {fmtKR(stats.totalPlanned)}
          </span>
          <span style={{ color: paceTone, fontWeight: 700 }}>{stats.paceDesc}</span>
        </div>
      </div>

      <div className="w-cc-hero-chips">
        <div className="chip">
          <div className="cl">📅 이번 달</div>
          <div className="cv">
            {fmtKR(stats.monthUsed)} / {fmtKR(stats.monthBudget)}
            <span className="cs"> · {monthUsedPct}%</span>
          </div>
        </div>
        <div className="chip">
          <div className="cl">💰 이번 주 가용</div>
          <div className="cv">
            {fmtKR(Math.max(0, stats.weeklyAvailable))}
            <span className="cs"> · 남은 {stats.weeksRemaining.toFixed(1)}주</span>
          </div>
        </div>
        <div className="chip">
          <div className="cl">📈 분기말 예상</div>
          <div className="cv">
            {fmtKR(stats.projectedQuarterEnd)}
            <span className="cs"> · 편성 {stats.projectedQuarterPct.toFixed(0)}% · {qProjLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
