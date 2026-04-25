import { fmt } from '../../../lib/corpCardMockData';

interface Props {
  dayMap: Record<string, number>;
  today: number;
  monthLabel: string;
  expectedByNow: number;
  monthUsed: number;
  burnPct: number;
}

/**
 * 일별 소진 바차트 — cash/project/charts.jsx 의 DailyBars 포팅 (외부 라이브러리 없이 div).
 * 미래일은 muted, 평균 70% 이상은 warn 컬러.
 */
export default function CorpCardDailyChart({
  dayMap,
  today,
  monthLabel,
  expectedByNow,
  monthUsed,
  burnPct,
}: Props) {
  const entries = Object.entries(dayMap);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          일별 소진 추이 <span className="w-cc-count">{monthLabel}</span>
        </div>
        <div className="w-cc-legend">
          <span>
            <i style={{ background: 'var(--w-accent)' }} />
            실제
          </span>
          <span>
            <i style={{ background: 'var(--w-urgency-todo)' }} />
            초과
          </span>
        </div>
      </div>

      <div className="w-cc-bars">
        {entries.map(([date, val]) => {
          const day = parseInt(date.split('-')[2], 10);
          const isFuture = day > today;
          const heightPct = isFuture ? 0 : val === 0 ? 0 : Math.max(2, (val / max) * 100);
          const isHigh = val > max * 0.7;
          const isToday = day === today;

          return (
            <div key={date} className={`w-cc-bar-col${isToday ? ' is-today' : ''}`}>
              <div className="w-cc-bar-cell">
                {!isFuture && val > 0 && (
                  <div
                    className={`w-cc-bar${isHigh ? ' over' : ''}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${date} · ${fmt(val)}원`}
                  />
                )}
                {isFuture && <div className="w-cc-bar muted" style={{ height: '2%' }} />}
              </div>
              <div
                className={`w-cc-bar-label${isToday ? ' today' : ''}`}
                title={isToday ? '오늘' : undefined}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 18px',
          fontSize: 11.5,
          color: 'var(--w-text-muted)',
          borderTop: '1px solid var(--w-border)',
          marginTop: 6,
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
                    ? 'var(--w-success)'
                    : 'var(--w-text)',
            }}
          >
            {fmt(monthUsed)}원
          </strong>{' '}
          ({burnPct.toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}
