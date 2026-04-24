import { useMemo } from 'react';
import { Store } from 'lucide-react';
import { classifyTransaction, fmt, type CorpTransaction } from '../../../lib/corpCardMockData';

interface Props {
  transactions: CorpTransaction[];
  limit?: number;
}

/**
 * 상위 사용처 TOP N — store_name(payee) 기준 집계.
 * 팀장 녹취 "어디에 쓰는지" 맥락 반영 — 개인 식별 없이 가맹점 기준.
 */
export default function CorpCardTopMerchants({ transactions, limit = 5 }: Props) {
  const top = useMemo(() => {
    const agg = new Map<string, { name: string; amount: number; count: number; category: string; icon: string }>();
    transactions.forEach((t) => {
      const key = (t.payee ?? '').trim();
      if (!key) return;
      const prev = agg.get(key);
      if (prev) {
        prev.amount += t.amount;
        prev.count += 1;
      } else {
        const c = classifyTransaction(t.memo);
        agg.set(key, { name: key, amount: t.amount, count: 1, category: c.label, icon: c.icon });
      }
    });
    return Array.from(agg.values()).sort((a, b) => b.amount - a.amount).slice(0, limit);
  }, [transactions, limit]);

  if (top.length === 0) {
    return (
      <div className="w-cc-card">
        <div className="w-cc-card-head">
          <div className="w-cc-card-title">상위 사용처</div>
        </div>
        <div className="w-cc-empty">이번 달 사용 내역이 없습니다.</div>
      </div>
    );
  }

  const maxAmount = top[0].amount;

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          상위 사용처 <span className="w-cc-count">TOP {top.length}</span>
        </div>
      </div>
      <div style={{ padding: '4px 0 8px' }}>
        {top.map((m, i) => {
          const pct = maxAmount === 0 ? 0 : (m.amount / maxAmount) * 100;
          return (
            <div
              key={m.name}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto 1fr auto',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderTop: '1px solid var(--w-border)',
              }}
            >
              <div
                style={{
                  width: 22,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: i < 3 ? 'var(--w-accent-hover)' : 'var(--w-text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--w-radius-sm)',
                  background: 'var(--w-surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                {m.icon || <Store size={14} color="var(--w-text-muted)" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--w-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={m.name}
                >
                  {m.name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)', marginBottom: 4 }}>
                  {m.category} · {m.count}건
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: 'var(--w-surface-2)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--w-accent)',
                      transition: 'width .4s',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--w-text)',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 60,
                  textAlign: 'right',
                }}
              >
                {fmt(m.amount)}원
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
