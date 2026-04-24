import { fmt, pct, type CorpAccount } from '../../../lib/corpCardMockData';

type AccountWithUsage = CorpAccount & { used: number; remaining: number };

interface Props {
  accounts: AccountWithUsage[];
}

/**
 * 계정별 예산 카드 — 행 단위 Stacked progress + 잔여/예산.
 * cash/project/app.jsx 의 .account-row 포팅.
 */
export default function CorpCardAccountList({ accounts }: Props) {
  const visible = accounts.filter((a) => a.planned > 0);

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head">
        <div className="w-cc-card-title">
          계정별 예산 <span className="w-cc-count">{visible.length}</span>
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="w-cc-empty">예산이 편성된 계정이 없습니다.</div>
      ) : (
        visible.map((a) => {
          const usedPct = pct(a.used, a.planned);
          const total = a.planned;
          const wc = total === 0 ? 0 : (a.completed / total) * 100;
          const wp = total === 0 ? 0 : (a.pending / total) * 100;
          const ws = total === 0 ? 0 : (a.saved / total) * 100;
          return (
            <div key={a.code} className="w-cc-acct-row">
              <div className="w-cc-acct-icon">{a.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="w-cc-acct-name">{a.shortName}</div>
                <div className="w-cc-acct-code">
                  {a.code} · {a.name}
                </div>
                <div style={{ marginTop: 7 }}>
                  <div className="w-cc-stack">
                    <span
                      className="w-cc-stack-completed"
                      style={{ width: `${wc}%` }}
                      title={`완료 ${fmt(a.completed)}원`}
                    />
                    <span
                      className="w-cc-stack-pending"
                      style={{ width: `${wp}%` }}
                      title={`처리중 ${fmt(a.pending)}원`}
                    />
                    <span
                      className="w-cc-stack-saved"
                      style={{ width: `${ws}%` }}
                      title={`저장 ${fmt(a.saved)}원`}
                    />
                  </div>
                  <div className="w-cc-acct-meta">
                    <span>{usedPct}% 사용</span>
                    <span>
                      완료 {fmt(a.completed)} · 처리중 {fmt(a.pending)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-cc-acct-amt">
                <div className="lbl">잔여</div>
                <div className={`val${usedPct > 80 ? ' danger' : ''}`}>{fmt(a.remaining)}원</div>
              </div>
              <div className="w-cc-acct-amt">
                <div className="lbl">예산</div>
                <div className="val muted">{fmt(a.planned)}원</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
