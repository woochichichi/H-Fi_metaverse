import { useMemo, useState } from 'react';
import { avatarColor, fmtKR, initial, type CorpMember, type CorpTransaction } from '../../../lib/corpCardMockData';
import TxDetailModal from './TxDetailModal';

type ActiveMember = CorpMember & { used: number; count: number; lastTx: string | null };

interface Props {
  activeMembers: ActiveMember[];
  /** 분기 전체 거래 — 팀원 클릭 시 그 사람 적요 필터링용. */
  transactions?: CorpTransaction[];
  /** true면 "관리자·리더 전체 보기" 배지를 헤더에 노출 — 일반 팀원은 본인만 보여서 배지 불필요 */
  isPrivilegedView?: boolean;
}

type SortKey = 'amount' | 'name' | 'recent';

/**
 * 팀원별 사용 카드 — 레이싱 바 + 정렬 토글.
 * cash/project/app.jsx 의 .member-list 포팅.
 */
export default function CorpCardMemberList({ activeMembers, transactions, isPrivilegedView }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('amount');
  const [detailFor, setDetailFor] = useState<ActiveMember | null>(null);

  const memberTxs = useMemo(() => {
    if (!detailFor || !transactions) return [];
    return transactions
      .filter((t) => t.user === detailFor.name)
      .sort((a, b) => (b.regDate || '').localeCompare(a.regDate || ''));
  }, [detailFor, transactions]);

  const sorted = useMemo(() => {
    const m = [...activeMembers];
    if (sortBy === 'amount') m.sort((a, b) => b.used - a.used);
    else if (sortBy === 'name') m.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    else if (sortBy === 'recent') m.sort((a, b) => (b.lastTx || '').localeCompare(a.lastTx || ''));
    return m;
  }, [activeMembers, sortBy]);

  const maxUsed = Math.max(...activeMembers.map((m) => m.used), 1);
  const sortLabel = sortBy === 'amount' ? '금액순' : sortBy === 'name' ? '이름순' : '최근순';

  const cycleSort = () =>
    setSortBy((cur) => (cur === 'amount' ? 'name' : cur === 'name' ? 'recent' : 'amount'));

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>팀원별 사용</span>
          <span className="w-cc-count">{activeMembers.length}</span>
          {isPrivilegedView ? (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'var(--w-accent-soft)',
                color: 'var(--w-accent-hover)',
                letterSpacing: '0.02em',
              }}
              title="관리자·리더만 전체 팀원을 확인할 수 있습니다"
            >
              관리자·리더 전체 보기
            </span>
          ) : (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'var(--w-surface-2)',
                color: 'var(--w-text-muted)',
                letterSpacing: '0.02em',
              }}
              title="일반 팀원은 본인 사용 내역만 볼 수 있습니다"
            >
              본인만 표시
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={cycleSort}
          style={{
            fontSize: 11.5,
            color: 'var(--w-text-muted)',
            background: 'none',
            border: 0,
            padding: '4px 8px',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {sortLabel} ⇅
        </button>
      </div>
      <div className="w-cc-mem-list">
        {sorted.length === 0 ? (
          <div className="w-cc-empty">이번 달 사용 내역이 없습니다.</div>
        ) : (
          sorted.map((m, i) => (
            <div
              key={m.name}
              className="w-cc-mem-row"
              onClick={() => transactions && setDetailFor(m)}
              role={transactions ? 'button' : undefined}
              title={transactions ? `${m.name}의 적요 ${m.count}건 보기` : undefined}
            >
              <div className={`w-cc-mem-rank${i < 3 ? ' top' : ''}`}>{i + 1}</div>
              <div className="w-cc-avatar" style={{ background: avatarColor(m.name) }}>
                {initial(m.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="w-cc-mem-name">{m.name}</div>
                <div className="w-cc-mem-sub">{m.count}건</div>
              </div>
              <div className="w-cc-mem-bar">
                <span style={{ width: `${(m.used / maxUsed) * 100}%` }} />
              </div>
              <div className="w-cc-mem-amt">{fmtKR(m.used)}</div>
            </div>
          ))
        )}
      </div>

      {detailFor && (
        <TxDetailModal
          title={`${detailFor.name} · ${detailFor.count}건`}
          subtitle="이번 분기 사용 내역"
          transactions={memberTxs}
          variant="member"
          onClose={() => setDetailFor(null)}
        />
      )}
    </div>
  );
}
