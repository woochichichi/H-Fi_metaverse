import { fmt, fmtKR, pct, type CorpTransaction, type DashboardStats } from '../../../lib/corpCardMockData';

interface Props {
  stats: DashboardStats;
  /** 분기 전체 거래 — 월별 분포 계산용 */
  transactions: CorpTransaction[];
  /** 활성 분기 period_ym (예: "202604") — 분기 시작월 계산 */
  periodYm: string;
  /** 예정 지출 합계 — "예정 차감 시 N원" 보조 표시용 (실제 합계엔 영향 없음) */
  plannedTotal?: number;
}

/**
 * 팀 예산 페이지의 단일 Hero — "얼마 썼고 / 얼마 남았고" 한 줄 답.
 * 분기 단위 메인 숫자 + 분기 안 월별 분포 chip 3개 (선택 분기 어느 월에 많이 썼는지).
 * 옆에 CorpCardCategoryDonut 가 "어디에" 답을 책임짐.
 */
export default function CorpCardSummaryHero({ stats, transactions, periodYm, plannedTotal = 0 }: Props) {
  const usedPct = pct(stats.totalUsed, stats.totalPlanned);
  const remainAfterPlanned = Math.max(0, stats.totalRemaining - plannedTotal);

  // 분기 시작월 (1, 4, 7, 10) 계산
  const year = parseInt(periodYm.slice(0, 4), 10);
  const month = parseInt(periodYm.slice(4, 6), 10);
  const qStart = Math.floor((month - 1) / 3) * 3 + 1;
  const months = [qStart, qStart + 1, qStart + 2];

  // 월별 사용액 집계
  const monthlyUsed: Record<number, number> = { [months[0]]: 0, [months[1]]: 0, [months[2]]: 0 };
  transactions.forEach((t) => {
    if (!t.regDate) return;
    const m = parseInt(t.regDate.slice(5, 7), 10);
    if (monthlyUsed[m] != null) monthlyUsed[m] += t.amount;
  });
  const maxMonthly = Math.max(monthlyUsed[months[0]], monthlyUsed[months[1]], monthlyUsed[months[2]], 1);

  const paceTone =
    stats.paceStatus === 'danger'
      ? 'var(--w-urgency-critical)'
      : stats.paceStatus === 'warn'
        ? 'var(--w-urgency-todo)'
        : stats.paceStatus === 'info'
          ? 'var(--w-urgency-info)'
          : 'var(--w-success)';

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
          {plannedTotal > 0 && (
            <div
              style={{
                fontSize: 11,
                color: '#fcd34d',
                marginTop: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
              title={`예정 지출 ${fmtKR(plannedTotal)} 차감 시 실 가용`}
            >
              예정 차감 시 <b style={{ fontWeight: 800 }}>{fmtKR(remainAfterPlanned)}</b>
            </div>
          )}
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
        {months.map((m) => {
          const used = monthlyUsed[m] ?? 0;
          const ratio = stats.totalUsed > 0 ? used / stats.totalUsed : 0;
          return (
            <div key={m} className="chip" title={`${year}년 ${m}월 사용액 ${fmt(used)}원`}>
              <div className="cl">{m}월</div>
              <div className="cv">
                {fmtKR(used)}
                <span className="cs"> · 분기 {(ratio * 100).toFixed(0)}%</span>
              </div>
              {/* 월별 비중 미니 막대 — chip 안에서 시각적 비교 */}
              <div
                style={{
                  marginTop: 4,
                  height: 3,
                  background: 'rgba(255,255,255,.08)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(used / maxMonthly) * 100}%`,
                    background: '#fcd34d',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
