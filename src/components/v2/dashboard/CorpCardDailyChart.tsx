import { fmt } from '../../../lib/corpCardMockData';

interface Props {
  dayMap: Record<string, number>;
  /** ISO date string (YYYY-MM-DD) — 분기 90일 중 "오늘" 위치 식별용. */
  todayDate: string;
  /** 차트 라벨 — "2026 2분기" 같은 분기 라벨. */
  quarterLabel: string;
  expectedByNow: number;
  monthUsed: number;
  burnPct: number;
}

/**
 * 분기별 일자별 소진 바차트 — 분기 약 90일 막대.
 * X축은 월 경계마다 "M월" 라벨, 그 외는 일자만.
 * 미래일은 빈 셀, 평균 70% 이상은 warn 컬러.
 */
export default function CorpCardDailyChart({
  dayMap,
  todayDate,
  quarterLabel,
  expectedByNow,
  monthUsed,
  burnPct,
}: Props) {
  const entries = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          일별 소진 추이 <span className="w-cc-count">{quarterLabel}</span>
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
        {entries.map(([date, val], idx) => {
          const day = parseInt(date.split('-')[2], 10);
          const month = parseInt(date.split('-')[1], 10);
          const isFuture = date > todayDate;
          const heightPct = isFuture ? 0 : val === 0 ? 0 : Math.max(2, (val / max) * 100);
          const isHigh = val > max * 0.7;
          const isToday = date === todayDate;
          // 90일 막대라 매일 일자 라벨은 너무 빽빽 — 월 시작/오늘/매주 일요일에만 표시.
          const showMonth = day === 1 || idx === 0;
          // 매주 7일 단위로만 일자 라벨 (90/7≈13개)
          const showDay = !showMonth && (day % 7 === 0 || isToday);

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
                title={isToday ? '오늘' : `${month}월 ${day}일`}
              >
                {showMonth ? `${month}월` : showDay ? day : ''}
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
