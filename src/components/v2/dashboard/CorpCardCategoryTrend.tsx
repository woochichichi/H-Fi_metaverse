import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { classifyByPurpose, COLOR, fmtKR, type CorpTransaction, type PurposeLabel } from '../../../lib/corpCardMockData';

interface Props {
  transactions: CorpTransaction[];
  /** 기간 라벨 — "2026 2분기" 같이 표시. */
  label?: string;
}

// 도넛과 동일한 카테고리 / 색상 (식대 제거됨, 취소 제외).
const CATEGORY_ORDER: PurposeLabel[] = [
  '공용', '교통', '점검', '야근', '회식', '교육',
  '간담회', '현업미팅', '팀원교류', '회의', '기타',
];

/**
 * 용도별 일별 추이 (분기 단위 스택드 바).
 * 분류는 도넛과 동일한 classifyByPurpose 기반 — 적요 키워드로 12개 카테고리.
 * x축은 "MM-DD" 단위지만 분기 90일이라 막대가 빽빽 — recharts 가 자동으로 라벨 thinning.
 */
export default function CorpCardCategoryTrend({ transactions, label }: Props) {
  const chartData = useMemo(() => {
    const byDay = new Map<string, Record<string, number>>();
    const seenCategories = new Set<PurposeLabel>();

    transactions.forEach((t) => {
      const c = classifyByPurpose(t.memo, t.acctCode);
      if (c.label === '취소') return; // 취소 거래 제외
      const day = t.regDate?.slice(5) ?? ''; // "MM-DD"
      if (!day) return;
      seenCategories.add(c.label);
      const row = byDay.get(day) ?? {};
      row[c.label] = (row[c.label] ?? 0) + t.amount;
      byDay.set(day, row);
    });

    const days = Array.from(byDay.keys()).sort();
    const points = days.map((day) => {
      const row = byDay.get(day)!;
      const out: Record<string, string | number> = { day };
      CATEGORY_ORDER.forEach((cat) => {
        out[cat] = row[cat] ?? 0;
      });
      return out;
    });

    const categories = CATEGORY_ORDER.filter((c) => seenCategories.has(c));
    return { points, categories };
  }, [transactions]);

  if (chartData.points.length === 0) {
    return (
      <div className="w-cc-card">
        <div className="w-cc-card-head">
          <div className="w-cc-card-title">용도별 일별 추이{label ? ` · ${label}` : ''}</div>
        </div>
        <div className="w-cc-empty">분류할 거래가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="w-cc-card" style={{ overflow: 'visible' }}>
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          용도별 일별 추이
          {label && <span className="w-cc-count">{label}</span>}
        </div>
      </div>
      <div style={{ padding: '8px 12px 12px' }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--w-border)" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="var(--w-text-muted)"
              tick={{ fontSize: 10 }}
              tickMargin={6}
            />
            <YAxis
              stroke="var(--w-text-muted)"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => (v >= 10000 ? `${Math.round(v / 10000)}만` : String(v))}
              width={44}
            />
            <Tooltip
              cursor={{ fill: 'var(--w-surface-2)', opacity: 0.4 }}
              allowEscapeViewBox={{ x: true, y: true }}
              // 차트 위쪽 여유 공간으로 고정 → 카드 아래로 흘러 스크롤 발생 방지
              position={{ y: -8 }}
              wrapperStyle={{ outline: 'none', zIndex: 100, pointerEvents: 'none' }}
              content={<TrendTooltipContent />}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="square" />
            {chartData.categories.map((cat) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="day"
                fill={COLOR[cat]}
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * 용도별 추이 커스텀 툴팁 — Tip 컴포넌트와 디자인 통일.
 * 기본 recharts tooltip 은 1열 세로 나열이라 카테고리 많으면 길어져
 * 차트 아래쪽으로 흘러 스크롤 유발. 2열 grid 로 압축 + position 으로
 * 차트 상단 고정 → 카드 안에서 항상 보이게.
 *
 * recharts 의 TooltipProps 가 generic 이라 우리 시그니처와 맞추기 까다로움 →
 * any 로 받아서 내부에서 안전하게 분해.
 */
type RechartsTipPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
};
function TrendTooltipContent(props: { active?: boolean; payload?: RechartsTipPayloadItem[]; label?: string | number }) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;
  const visible = payload.filter((p) => typeof p.value === 'number' && (p.value as number) > 0);
  if (visible.length === 0) return null;
  const total = visible.reduce((s, p) => s + (p.value as number), 0);

  return (
    <div
      style={{
        minWidth: 200,
        maxWidth: 320,
        padding: '10px 12px',
        background: '#1f1a18',
        color: '#fbf6ef',
        borderRadius: 8,
        fontSize: 11.5,
        lineHeight: 1.4,
        boxShadow: '0 6px 24px rgba(0,0,0,.28)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 12.5,
          marginBottom: 6,
          paddingBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,.12)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span>{label}</span>
        <span style={{ color: '#fcd34d' }}>{fmtKR(total)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {visible.map((p) => (
          <div key={String(p.dataKey)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: p.color,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, color: '#d4cfc7' }}>{p.name}</span>
            <span style={{ fontWeight: 700 }}>{fmtKR(p.value as number)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
