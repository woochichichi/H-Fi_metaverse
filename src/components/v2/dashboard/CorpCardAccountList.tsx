import { useState } from 'react';
import { fmt, type CorpAccount } from '../../../lib/corpCardMockData';
import { formatKST } from '../../../lib/utils';

type AccountWithUsage = CorpAccount & { used: number; remaining: number };

interface Props {
  accounts: AccountWithUsage[];
  capturedAt?: string;
}

/**
 * 계정별 예산 (SAP 통제예산조회 동일 컬럼 구조).
 *
 * 컬럼: 계정과목 | 편성예산(A) | 저장(B) | 처리중(C) | 처리완료(D) | 잔여금액(A−B−C−D)
 *
 * 잔여금액 셀은 background bar 게이지를 통합해 잔량 비율을 시각화 (C안).
 * - 잔량 비율 = remaining/planned
 * - 색: 80%↑ 여유(녹), 20~80% 보통(주황), 20%↓ 위험(적)
 * - SAP 표 컬럼 순서·산식 그대로라 익숙함 유지하면서 잔량 직관 보강.
 */
export default function CorpCardAccountList({ accounts, capturedAt }: Props) {
  const visible = accounts.filter((a) => a.planned > 0);

  return (
    <div className="w-cc-card">
      <div className="w-cc-card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="w-cc-card-title">
          계정별 예산 <span className="w-cc-count">{visible.length}</span>
        </div>
        {capturedAt && <CapturedAtMini capturedAt={capturedAt} />}
      </div>
      {visible.length === 0 ? (
        <div className="w-cc-empty">예산이 편성된 계정이 없습니다.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>계정과목</th>
                <th style={thStyle}>
                  편성예산<span style={formulaStyle}> (A)</span>
                </th>
                <th style={thStyle}>
                  저장<span style={formulaStyle}> (B)</span>
                </th>
                <th style={thStyle}>
                  처리중<span style={formulaStyle}> (C)</span>
                </th>
                <th style={thStyle}>
                  처리완료<span style={formulaStyle}> (D)</span>
                </th>
                <th style={{ ...thStyle, minWidth: 220 }}>
                  잔여금액<span style={formulaStyle}> (A−B−C−D)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const remainPct = a.planned === 0 ? 0 : (a.remaining / a.planned) * 100;
                const tone = remainPct >= 80 ? 'ok' : remainPct >= 20 ? 'warn' : 'danger';
                const tonePct =
                  tone === 'ok'
                    ? 'var(--w-success)'
                    : tone === 'warn'
                      ? 'var(--w-warning)'
                      : 'var(--w-danger)';
                return (
                  <tr key={a.code} title={`${a.code} · ${a.name}`}>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: 'var(--w-text)', fontSize: 13 }}>
                        {a.shortName}
                      </div>
                    </td>
                    <td style={tdStyle}>{fmt(a.planned)}</td>
                    <td style={{ ...tdStyle, color: 'var(--w-text-muted)' }}>{fmt(a.saved)}</td>
                    <td style={{ ...tdStyle, color: 'var(--w-text-muted)' }}>{fmt(a.pending)}</td>
                    <td style={{ ...tdStyle, color: 'var(--w-text-muted)' }}>{fmt(a.completed)}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 800,
                        fontSize: 13.5,
                        paddingRight: 12,
                      }}
                    >
                      {/* 잔여 — 배경 게이지 제거, "% 남음" 텍스트만 컬러로 상태 신호 */}
                      {fmt(a.remaining)}원
                      <span
                        style={{
                          display: 'block',
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: tonePct,
                          marginTop: 1,
                        }}
                      >
                        {remainPct.toFixed(1)}% 남음
                      </span>
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

/** 카드 헤더 우측에 짧게 표시되는 수집 시각. */
function CapturedAtMini({ capturedAt }: { capturedAt: string }) {
  const [now] = useState<number>(() => Date.now());
  const d = new Date(capturedAt);
  const diffMin = Math.max(0, Math.floor((now - d.getTime()) / 60000));
  const rel =
    diffMin < 1
      ? '방금'
      : diffMin < 60
        ? `${diffMin}분 전`
        : diffMin < 60 * 24
          ? `${Math.floor(diffMin / 60)}시간 전`
          : `${Math.floor(diffMin / (60 * 24))}일 전`;
  return (
    <span
      style={{ fontSize: 11, color: 'var(--w-text-muted)', fontWeight: 500 }}
      title={`수집 시각: ${d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`}
    >
      {formatKST(d)} 수집 · {rel}
    </span>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12.5,
  fontVariantNumeric: 'tabular-nums',
};

const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  textAlign: 'right',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--w-text-muted)',
  background: 'var(--w-surface-2)',
  borderBottom: '1px solid var(--w-border-strong)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'right',
  borderBottom: '1px solid var(--w-border)',
  verticalAlign: 'middle',
};

const formulaStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 500,
  color: 'var(--w-text-muted)',
};
