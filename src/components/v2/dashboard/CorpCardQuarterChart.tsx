import { fmtKR } from '../../../lib/corpCardMockData';
import type { TrendPoint } from '../../../hooks/useCorpCardTrend';

interface Props {
  /** 최근 N일 snapshot 추이 (총 소진 누적) */
  points: TrendPoint[];
  /** 분기 총 편성 (Y축 상한 참고) */
  totalPlanned: number;
  /** 분기 총 사용 (현재) */
  totalUsed: number;
  loading: boolean;
}

const W = 720;
const H = 200;
const PAD_L = 56;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;

/**
 * 분기 소진 흐름 차트 — cash/project/charts.jsx 의 QuarterCompareChart 를
 * src/hooks/useCorpCardTrend 의 TrendPoint[] 기반으로 재작성.
 *
 * Q1 비교용 데이터가 아직 없으므로, 현재는 "최근 N일 누적 소진" 한 줄을
 * 영역 채움과 함께 그리고, 마지막 포인트만 마커로 강조한다.
 * Q1 데이터가 들어오면 두 번째 라인으로 점선 추가하면 된다.
 */
export default function CorpCardQuarterChart({ points, totalPlanned, totalUsed, loading }: Props) {
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  if (loading) {
    return (
      <div className="w-cc-empty" style={{ height: H }}>
        분기 추이 데이터를 불러오는 중…
      </div>
    );
  }

  if (points.length < 2) {
    return (
      <div className="w-cc-empty" style={{ height: H }}>
        추이를 그리려면 최소 2일치 수집 데이터가 필요합니다.
      </div>
    );
  }

  const yMax = Math.max(...points.map((p) => p.totalUsed), totalPlanned * 0.5, 1) * 1.05;
  const xFor = (i: number) => PAD_L + (i / (points.length - 1)) * innerW;
  const yFor = (v: number) => PAD_T + innerH - (v / yMax) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p.totalUsed).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${xFor(points.length - 1).toFixed(1)},${yFor(0).toFixed(1)} L${xFor(0).toFixed(1)},${yFor(0).toFixed(1)} Z`;

  // Y 눈금 5단계
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => yMax * p);

  // 마지막 포인트
  const last = points[points.length - 1];
  const lastX = xFor(points.length - 1);
  const lastY = yFor(last.totalUsed);

  // X 라벨 — 시작/중간/끝
  const labelIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block' }}
      preserveAspectRatio="none"
      role="img"
      aria-label={`분기 소진 흐름 — 최근 ${points.length}일, 현재 누적 ${fmtKR(totalUsed)}원`}
    >
      {/* 격자 */}
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
            {v >= 10000000
              ? `${(v / 10000000).toFixed(1)}천만`
              : v >= 10000
                ? `${(v / 10000).toFixed(0)}만`
                : v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* 영역 + 라인 */}
      <path d={areaPath} fill="var(--w-accent)" opacity="0.12" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--w-accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* 마지막 마커 */}
      <line
        x1={lastX}
        y1={PAD_T}
        x2={lastX}
        y2={PAD_T + innerH}
        stroke="var(--w-accent)"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.35"
      />
      <circle cx={lastX} cy={lastY} r="4.5" fill="var(--w-accent)" stroke="var(--w-surface)" strokeWidth="2" />
      <text
        x={lastX - 6}
        y={lastY - 8}
        textAnchor="end"
        fontSize="11"
        fill="var(--w-accent-hover)"
        fontWeight="700"
        fontFamily="JetBrains Mono, ui-monospace, Menlo, monospace"
      >
        {fmtKR(last.totalUsed)}
      </text>

      {/* X 라벨 */}
      {labelIdx.map((i) => (
        <text
          key={i}
          x={xFor(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize="10.5"
          fill="var(--w-text-muted)"
          fontWeight="600"
        >
          {points[i]?.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}
