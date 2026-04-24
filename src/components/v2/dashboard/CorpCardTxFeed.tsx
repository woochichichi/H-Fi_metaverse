import {
  avatarColor,
  classifyTransaction,
  fmt,
  initial,
  type CorpTransaction,
} from '../../../lib/corpCardMockData';

interface Props {
  transactions: CorpTransaction[];
  /** 표시 개수 제한 (기본 12) */
  limit?: number;
}

/**
 * 실시간 거래 피드 — cash/project/app.jsx 의 .tx-table 포팅.
 * 카테고리 자동 분류, 상태 배지, 사용자 아바타.
 */
export default function CorpCardTxFeed({ transactions, limit = 12 }: Props) {
  const recent = [...transactions]
    .sort((a, b) => (b.regDate || '').localeCompare(a.regDate || ''))
    .slice(0, limit);

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          실시간 거래 피드 <span className="w-cc-count">{transactions.length}</span>
        </div>
      </div>
      {recent.length === 0 ? (
        <div className="w-cc-empty">아직 등록된 거래가 없습니다.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="w-cc-tx-table">
            <thead>
              <tr>
                <th>등록일</th>
                <th>사용자</th>
                <th>카테고리</th>
                <th>적요</th>
                <th style={{ textAlign: 'right' }}>금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t, i) => {
                const cat = classifyTransaction(t.memo);
                const catKey =
                  cat.account === '53001040'
                    ? 'meal'
                    : cat.account === '53405010'
                      ? 'meeting'
                      : 'transport';
                const statusKey = t.status === '승인' ? 'approved' : 'pending';
                return (
                  <tr key={`${t.ea || 'tx'}-${i}`}>
                    <td className="w-cc-tx-date">{t.regDate.slice(5)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className="w-cc-avatar"
                          style={{ background: avatarColor(t.user), width: 22, height: 22, fontSize: 10 }}
                        >
                          {initial(t.user)}
                        </div>
                        <span style={{ fontSize: 12 }}>{t.user || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`w-cc-cat-pill ${catKey}`}>
                        {cat.icon} {cat.label}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: 360,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 12,
                          color: 'var(--w-text-soft)',
                        }}
                        title={t.memo}
                      >
                        {t.memo}
                      </div>
                    </td>
                    <td className="w-cc-tx-amt">{fmt(t.amount)}</td>
                    <td>
                      <span className={`w-cc-tx-status ${statusKey}`}>{t.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
