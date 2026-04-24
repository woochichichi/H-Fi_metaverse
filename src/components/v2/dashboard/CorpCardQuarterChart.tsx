import { fmtKR } from '../../../lib/corpCardMockData';
import type { QuarterSeries } from '../../../hooks/useQuarterCompare';

interface Props {
  /** 현재 분기 (오늘까지만 그림) */
  current: QuarterSeries | null;
  /** 직전 분기 (완료된 전체) */
  previous: QuarterSeries | null;
  /** current 의 오늘 경과일 (마커 위치) */
  currentTodayDay: number | null;
  loading: boolean;
}

const W = 720;
const H = 220;
const PAD_L = 60;
const PAD_R = 18;
const PAD_T = 18;
const PAD_B = 42;

/**
 * 분기별 누적 소진 overlay 차트.
 * X축: 분기 시작일 기준 경과일 (0~daysInQuarter-1)
 * Y축: 누적 소진액
 *  - previous: 점선 (회색) — 완료된 직전 분기
 *  - current : 실선 (accent) — 진행 중 분기 (오늘까지)
 */
export default function CorpCardQuarterChart({ current, previous, currentTodayDay, loading }: Props) {
  if (loading) {
    return <div className="w-cc-empty" style={{ height: H }}>분기 비교 데이터를 불러오는 중…</div>;
  }
  if (!current && !previous) {
    return <div className="w-cc-empty" style={{ height: H }}>분기 데이터가 없습니다.</div>;
  }

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const daysAxis = Math.max(
    current?.daysInQuarter ?? 0,
    previous?.daysInQuarter ?? 0,
    90,
  );

  const yMax = Math.max(
    ...(current?.points.map((p) => p.used) ?? [0]),
    ...(previous?.points.map((p) => p.used) ?? [0]),
    (current?.totalPlanned ?? 0) * 0.5,
    (previous?.totalPlanned ?? 0) * 0.5,
    1,
  ) * 1.1;

  const xFor = (day: number) => PAD_L + (day / Math.max(1, daysAxis - 1)) * innerW;
  const yFor = (v: number) => PAD_T + innerH - (v / yMax) * innerH;

  const pathOf = (pts: { day: number; used: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(p.day).toFixed(1)},${yFor(p.used).toFixed(1)}`).join(' ');

  const curPath = current ? pathOf(current.points) : '';
  const prevPath = previous ? pathOf(previous.points) : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => yMax * p);

  // X축 라벨 — 분기 시작월/중간월/끝월 표시
  const qInfo = current ?? previous;
  const month1 = qInfo ? parseInt(qInfo.quarterStart.slice(5, 7), 10) : 1;
  const xLabels: { day: number; text: string }[] = qInfo
    ? [
        { day: 0, text: `${month1}월` },
        { day: Math.floor(daysAxis / 3), text: `${((month1 % 12) || 12) + 0}월 중` },
        { day: Math.floor((daysAxis * 2) / 3), text: `${month1 + 1}월 말` },
        { day: daysAxis - 1, text: `${month1 + 2}월 말` },
      ]
    : [];

  const fmtY = (v: number) =>
    v >= 10000000
      ? `${(v / 10000000).toFixed(1)}천만`
      : v >= 10000
        ? `${(v / 10000).toFixed(0)}만`
        : v.toFixed(0);

  // 최신 포인트 (current 있으면 current 마지막, 없으면 previous 마지막)
  const lastSeries = current ?? previous!;
  const lastPt = lastSeries.points[lastSeries.points.length - 1];
  const lastX = xFor(lastPt.day);
  const lastY = yFor(lastPt.used);

  // 오늘 기준 prev 와 cur 비교 — X 가 같을 때 두 값의 차이
  const prevAtToday = (() => {
    if (!previous || currentTodayDay === null) return null;
    const same = previous.points.find((p) => p.day === currentTodayDay);
    return same ? same.used : null;
  })();
  const dodText = (() => {
    if (!current || prevAtToday === null) return null;
    const curUsed = current.points[current.points.length - 1]?.used ?? 0;
    const diff = curUsed - prevAtToday;
    const pct = prevAtToday === 0 ? null : (diff / prevAtToday) * 100;
    return { diff, pct };
  })();

  return (
    <div>
      {/* 범례 */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          padding: '4px 12px 6px',
          fontSize: 11.5,
          color: 'var(--w-text-muted)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {current && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 18, height: 2, background: 'var(--w-accent)', borderRadius: 1 }} />
            {current.label} (진행중)
          </span>
        )}
        {previous && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 18,
                height: 0,
                borderTop: '2px dashed var(--w-text-muted)',
                display: 'inline-block',
              }}
            />
            {previous.label} (완료)
          </span>
        )}
        {dodText && (
          <span style={{ marginLeft: 'auto', fontWeight: 700, color: dodText.diff >= 0 ? 'var(--w-urgency-todo)' : 'var(--w-accent-hover)' }}>
            같은 시점 대비 {dodText.diff >= 0 ? '+' : ''}{fmtKR(dodText.diff)}
            {dodText.pct !== null && ` (${dodText.pct >= 0 ? '+' : ''}${dodText.pct.toFixed(0)}%)`}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block' }}
        preserveAspectRatio="none"
        role="img"
        aria-label="분기별 누적 소진 비교"
      >
        {/* 격자 + Y 라벨 */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={yFor(v)}
              x2={W - PAD_R}
              y2={yFor(v)}
              stroke="var(--w-border)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '2 3'}
            />
            <text
              x={PAD_L - 8}
              y={yFor(v) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--w-text-muted)"
              fontFamily="JetBrains Mono, ui-monospace, Menlo, monospace"
            >
              {fmtY(v)}
            </text>
          </g>
        ))}

        {/* 이전 분기 — 점선 */}
        {previous && prevPath && (
          <path
            d={prevPath}
            fill="none"
            stroke="var(--w-text-muted)"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.75"
          />
        )}

        {/* 현재 분기 영역 + 선 */}
        {current && curPath && (
          <>
            <path
              d={`${curPath} L${xFor(current.points[current.points.length - 1].day).toFixed(1)},${yFor(0).toFixed(1)} L${xFor(0).toFixed(1)},${yFor(0).toFixed(1)} Z`}
              fill="var(--w-accent)"
              opacity="0.1"
            />
            <path
              d={curPath}
              fill="none"
              stroke="var(--w-accent)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {/* 오늘 세로선 + 마커 */}
        {currentTodayDay !== null && current && (
          <>
            <line
              x1={xFor(currentTodayDay)}
              y1={PAD_T}
              x2={xFor(currentTodayDay)}
              y2={PAD_T + innerH}
              stroke="var(--w-accent)"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.45"
            />
            <circle cx={lastX} cy={lastY} r="4.5" fill="var(--w-accent)" stroke="var(--w-surface)" strokeWidth="2" />
            <text
              x={Math.min(lastX + 8, W - PAD_R - 50)}
              y={Math.max(PAD_T + 14, lastY - 8)}
              textAnchor="start"
              fontSize="11"
              fill="var(--w-accent-hover)"
              fontWeight="700"
              fontFamily="JetBrains Mono, ui-monospace, Menlo, monospace"
            >
              {fmtKR(lastPt.used)}
            </text>
          </>
        )}

        {/* X 라벨 */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={xFor(l.day)}
            y={H - 10}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--w-text-muted)"
            fontWeight="600"
          >
            {l.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
