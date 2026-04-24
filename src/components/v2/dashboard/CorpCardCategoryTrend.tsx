import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { classifyTransaction, fmtKR, type CorpTransaction } from '../../../lib/corpCardMockData';

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
 * 카테고리별 일별 사용 추이 (멀티 라인).
 * X축 일(day), Y축 금액, 각 카테고리별 색상 라인.
 */
export default function CorpCardCategoryTrend({ transactions, monthLabel }: Props) {
  const chartData = useMemo(() => {
    // day -> category -> sum
    const byDay = new Map<string, Record<string, number>>();
    const seenCategories = new Set<string>();

    transactions.forEach((t) => {
      const c = classifyTransaction(t.memo);
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
          <LineChart data={chartData.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--w-border)" />
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
              contentStyle={{
                background: 'var(--w-surface)',
                border: '1px solid var(--w-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => (typeof value === 'number' ? `${fmtKR(value)}` : String(value))}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
            {chartData.categories.map((cat) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={CATEGORY_COLOR[cat]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
