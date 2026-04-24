import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { classifyTransaction, fmt, fmtKR, type CorpTransaction } from '../../../lib/corpCardMockData';

interface Props {
  transactions: CorpTransaction[];
}

/**
 * 카테고리별 사용 비중 도넛 — 팀장 피드백 "사람 기준 아니라 용도 기준으로".
 * classifyTransaction(memo) 로 거래를 4개 카테고리(교통/회의/식대/기타)로 분류.
 */
export default function CorpCardCategoryDonut({ transactions }: Props) {
  const { data, total } = useMemo(() => {
    const agg = new Map<string, { label: string; icon: string; amount: number; count: number; color: string }>();
    const colorByLabel: Record<string, string> = {
      '식대': '#f59e0b',
      '회의': '#6C5CE7',
      '교통': '#3b82f6',
      '기타': '#94a3b8',
    };
    transactions.forEach((t) => {
      const c = classifyTransaction(t.memo);
      const prev = agg.get(c.label) ?? {
        label: c.label,
        icon: c.icon,
        amount: 0,
        count: 0,
        color: colorByLabel[c.label] ?? '#64748b',
      };
      prev.amount += t.amount;
      prev.count += 1;
      agg.set(c.label, prev);
    });
    const arr = Array.from(agg.values()).sort((a, b) => b.amount - a.amount);
    const t = arr.reduce((s, x) => s + x.amount, 0);
    return { data: arr, total: t };
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="w-cc-card">
        <div className="w-cc-card-head">
          <div className="w-cc-card-title">용도별 사용 비중</div>
        </div>
        <div className="w-cc-empty">이번 달 분류할 거래가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          용도별 사용 비중 <span className="w-cc-count">{data.length}개 카테고리</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '8px 12px 12px', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="label"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                stroke="var(--w-surface)"
              >
                {data.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--w-surface)',
                  border: '1px solid var(--w-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, _name, entry) => {
                  const v = typeof value === 'number' ? value : 0;
                  const payload = entry?.payload as { count?: number; label?: string } | undefined;
                  return [`${fmt(v)}원 · ${payload?.count ?? 0}건`, payload?.label ?? ''];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)', fontWeight: 600 }}>총 사용</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--w-text)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtKR(total)}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d) => {
            const pct = total === 0 ? 0 : (d.amount / total) * 100;
            return (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: d.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--w-text)', minWidth: 48 }}>
                  {d.icon} {d.label}
                </span>
                <span style={{ flex: 1, fontSize: 11, color: 'var(--w-text-muted)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(d.amount)}원
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--w-accent-hover)',
                    minWidth: 40,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
