import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { classifyByAcctCode, fmtKR, type CorpTransaction } from '../../../lib/corpCardMockData';

interface Props {
  transactions: CorpTransaction[];
  /** 월 레이블 (예: 2026.04) — 상단 뱃지용 */
  monthLabel?: string;
}

const CATEGORY_ORDER = ['식대', '회의', '교통', '기타'] as const;
const CATEGORY_COLOR: Record<string, string> = {
  '식대': '#f59e0b',
  '회의': '#6C5CE7',
  '교통': '#3b82f6',
  '기타': '#94a3b8',
};

/**
 * 카테고리별 일별 사용 추이 (스택드 바).
 * 회계 데이터는 "거래가 있는 날만" 의미가 있어서 라인 차트로 보간하면 무거래일이 0~피크를
 * 부드럽게 잇거나(monotone) 단절적으로 보이는(stepAfter) 시각 왜곡 발생. 스택드 바는
 * 거래가 있는 날만 막대가 서고 카테고리 합도 그대로 보여서 가장 정확하고 직관적.
 */
export default function CorpCardCategoryTrend({ transactions, monthLabel }: Props) {
  const chartData = useMemo(() => {
    // day -> category -> sum
    const byDay = new Map<string, Record<string, number>>();
    const seenCategories = new Set<string>();

    transactions.forEach((t) => {
      const c = classifyByAcctCode(t.acctCode);
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

    // 실제 등장한 카테고리만 라인으로
    const categories = CATEGORY_ORDER.filter((c) => seenCategories.has(c));
    return { points, categories };
  }, [transactions]);

  if (chartData.points.length === 0) {
    return (
      <div className="w-cc-card">
        <div className="w-cc-card-head">
          <div className="w-cc-card-title">용도별 일별 추이{monthLabel ? ` · ${monthLabel}` : ''}</div>
        </div>
        <div className="w-cc-empty">이번 달 분류할 거래가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          용도별 일별 추이
          {monthLabel && <span className="w-cc-count">{monthLabel}</span>}
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
                fill={CATEGORY_COLOR[cat]}
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
