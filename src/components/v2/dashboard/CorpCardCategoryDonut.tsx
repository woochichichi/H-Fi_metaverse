import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { classifyByPurpose, fmt, fmtKR, type CorpTransaction, type PurposeLabel } from '../../../lib/corpCardMockData';
import TxDetailModal from './TxDetailModal';

interface Props {
  transactions: CorpTransaction[];
}

/**
 * 용도별 사용 비중 도넛 — 적요(memo) + 회계계정 기반 분류.
 * 카테고리: 공용 / 교통 / 점검 / 야근 / 회식 / 교육 / 간담회 / 현업미팅 / 팀원교류 / 회의 / 식대 / 기타
 * (취소 거래는 집계에서 제외)
 */
export default function CorpCardCategoryDonut({ transactions }: Props) {
  const [hovered, setHovered] = useState(false);
  const [drillLabel, setDrillLabel] = useState<PurposeLabel | null>(null);

  // 선택한 카테고리의 거래만 필터 — 라벨 매칭으로 동일 분류 함수 사용
  const drillTxs = useMemo(() => {
    if (!drillLabel) return [];
    return transactions.filter((t) => classifyByPurpose(t.memo, t.acctCode).label === drillLabel);
  }, [drillLabel, transactions]);

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
        <div className="w-cc-empty">이번 분기 분류할 거래가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="w-cc-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          주로 어디에 <span className="w-cc-count">이번 분기</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', padding: '12px 20px 18px', gap: 24 }}>
        <div
          style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="label"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={2}
                stroke="var(--w-surface)"
              >
                {data.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ outline: 'none', zIndex: 100 }}
                contentStyle={{
                  background: '#1f1a18',
                  border: '1px solid #1f1a18',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#fbf6ef',
                  boxShadow: '0 6px 24px rgba(0,0,0,.28)',
                }}
                labelStyle={{ color: '#fbf6ef' }}
                itemStyle={{ color: '#fbf6ef' }}
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
              opacity: hovered ? 0 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--w-text-muted)', fontWeight: 600 }}>총 사용</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--w-text)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {fmtKR(total)}
            </div>
          </div>
        </div>

        {/* 내역 리스트 — 도넛 우측 남는 공간 전부 사용 (이전 maxWidth 캡 제거) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 18px' }}>
          {data.map((d) => {
            const pct = total === 0 ? 0 : (d.amount / total) * 100;
            return (
              <button
                key={d.label}
                type="button"
                onClick={() => setDrillLabel(d.label as PurposeLabel)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  background: 'transparent',
                  border: 0,
                  borderRadius: 6,
                  padding: '6px 8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--w-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                title={`${d.label} 거래 ${d.count}건 보기`}
              >
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
                  <span
                    style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--w-text)' }}
                    title={d.label === '기타' ? '키워드로 분류되지 않은 미분류 거래' : undefined}
                  >
                    {d.label}
                    {d.label === '기타' && (
                      <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--w-text-muted)', marginLeft: 4 }}>
                        (미분류)
                      </span>
                    )}
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
              </button>
            );
          })}
        </div>
      </div>

      {drillLabel && (
        <TxDetailModal
          title={`${drillLabel}${drillLabel === '기타' ? ' (미분류)' : ''} · ${drillTxs.length}건`}
          subtitle="이번 분기 거래 적요"
          transactions={drillTxs}
          // 모든 카테고리에서 "적요 수정 요청" 버튼 노출 → 분류 오류 발견 시 즉시 제보
          variant="category"
          categoryLabel={drillLabel}
          onClose={() => setDrillLabel(null)}
        />
      )}
    </div>
  );
}
