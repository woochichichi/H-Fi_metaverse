import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { classifyByPurpose, fmt, fmtKR, type CorpTransaction } from '../../../lib/corpCardMockData';

interface Props {
  transactions: CorpTransaction[];
}

/**
 * 용도별 사용 비중 도넛 — 적요(memo) + 회계계정 기반 분류.
 * 카테고리: 공용 / 교통 / 점검 / 야근 / 회식 / 교육 / 간담회 / 현업미팅 / 팀원교류 / 회의 / 식대 / 기타
 * (취소 거래는 집계에서 제외)
 */
export default function CorpCardCategoryDonut({ transactions }: Props) {
  const { data, total } = useMemo(() => {
    const agg = new Map<string, { label: string; amount: number; count: number; color: string }>();
    transactions.forEach((t) => {
      const c = classifyByPurpose(t.memo, t.acctCode);
      if (c.label === '취소') return; // 취소 거래는 집계 제외
      const prev = agg.get(c.label) ?? { label: c.label, amount: 0, count: 0, color: c.color };
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
    <div className="w-cc-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          주로 어디에 <span className="w-cc-count">이번 달</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '8px 16px 14px', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
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

        {/* 와이드 화면에서 라벨·금액·% 가 화면 양 끝으로 흩어지지 않도록 maxWidth 캡 + 바 시각화 */}
        <div style={{ flex: '1 1 280px', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((d) => {
            const pct = total === 0 ? 0 : (d.amount / total) * 100;
            return (
              <div key={d.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: d.color,
                      flexShrink: 0,
                      alignSelf: 'center',
                    }}
                  />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--w-text)' }}>
                    {d.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: d.color,
                      fontVariantNumeric: 'tabular-nums',
                      marginLeft: 'auto',
                    }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--w-text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmt(d.amount)}원
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'var(--w-surface-2)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: d.color,
                      borderRadius: 999,
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
