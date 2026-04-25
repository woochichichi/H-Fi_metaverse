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
    <div className="w-cc-card">
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
              contentStyle={{
                background: 'var(--w-surface)',
                border: '1px solid var(--w-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => (typeof value === 'number' ? `${fmtKR(value)}` : String(value))}
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
