import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X, MessageSquarePlus, Check, ArrowLeft } from 'lucide-react';
import { classifyByPurpose, fmt, fmtKR, type CorpTransaction } from '../../../lib/corpCardMockData';
import { useThemeStore } from '../../../stores/themeStore';
import { useSiteReports } from '../../../hooks/useSiteReports';
import { useV2Toast } from '../ui/Toast';

interface Props {
  /** 모달 제목. 예: "전우형 · 7건" 또는 "기타 (미분류) · 19건" */
  title: string;
  /** 부제 (옵션). 예: "이번 분기 사용한 거래" */
  subtitle?: string;
  /** 표시할 거래 목록 */
  transactions: CorpTransaction[];
  /** 모달 종류 — 'category' 일 때 "적요 수정 요청" 버튼 노출 */
  variant?: 'member' | 'category';
  /** category 이름 — 사이트 제보 메시지에 포함 */
  categoryLabel?: string;
  onClose: () => void;
}

/**
 * 거래 적요 목록 모달.
 * - 팀원 이름 클릭 → 그 팀원의 적요 목록
 * - 도넛 카테고리 클릭 → 그 카테고리에 속한 거래의 적요 목록
 *   (특히 '기타(미분류)' 클릭 시 "관리자에게 키워드 추가 요청" 버튼 노출)
 *
 * createPortal(body) — backdrop-filter + fixed stacking 회피.
 */
export default function TxDetailModal({
  title,
  subtitle,
  transactions,
  variant = 'member',
  categoryLabel,
  onClose,
}: Props) {
  // portal 은 .v2-warm/.v2-dark 스코프 밖이라 토큰이 안 먹음 → wrapper 에 themeClass 적용
  const themeClass = useThemeStore((s) => (s.version === 'dark' ? 'v2-dark' : 'v2-warm'));
  const { createReport } = useSiteReports();
  const showToast = useV2Toast((s) => s.show);
  const [submitting, setSubmitting] = useState(false);
  // 'list' = 적요 목록 / 'compose' = 수정 요청 작성 폼
  const [view, setView] = useState<'list' | 'compose'>('list');
  const [reportContent, setReportContent] = useState('');

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const total = transactions.reduce((s, t) => s + t.amount, 0);

  const handleSubmitReport = async () => {
    const userText = reportContent.trim();
    if (!userText) {
      showToast('어떤 점이 문제인지 적어주세요', 'error');
      return;
    }
    const memos = transactions
      .slice(0, 30)
      .map((t) => `- ${t.regDate ?? ''} ${t.memo} (${fmt(t.amount)}원)`)
      .join('\n');
    const title = `[팀 예산] '${categoryLabel ?? '카테고리'}' 적요 수정 요청`;
    const content =
      `현재 '${categoryLabel ?? '카테고리'}' 로 분류된 거래 ${transactions.length}건에 대한 수정 요청입니다.\n\n` +
      `=== 요청 내용 ===\n${userText}\n\n` +
      `=== 해당 거래 적요 (상위 ${Math.min(30, transactions.length)}건) ===\n${memos}`;

    setSubmitting(true);
    const { error } = await createReport({ title, content });
    setSubmitting(false);
    if (error) {
      showToast(`접수 실패: ${error}`, 'error');
      return;
    }
    showToast('사이트 제보로 접수되었습니다', 'success');
    onClose();
  };

  return createPortal(
    <div className={themeClass}>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(42,31,26,.18)',
          zIndex: 300,
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 301,
          width: '90vw',
          maxWidth: 720,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--w-surface)',
          color: 'var(--w-text)',
          borderRadius: 12,
          boxShadow: '0 12px 48px rgba(0,0,0,.25)',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--w-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-text)' }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 11.5, color: 'var(--w-text-muted)', marginTop: 2 }}>
                {subtitle} · 총 {fmtKR(total)}
              </div>
            )}
          </div>
          {/* list 뷰: 카테고리 모달이면 "적요 수정 요청" 버튼 (모든 카테고리에서) */}
          {view === 'list' && variant === 'category' && transactions.length > 0 && (
            <button
              type="button"
              onClick={() => setView('compose')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: 'var(--w-accent)',
                color: '#fff',
                border: 0,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title="이 카테고리 거래들의 적요 분류가 잘못됐다면 사이트 제보로 수정 요청을 보냅니다"
            >
              <MessageSquarePlus size={13} />
              적요 수정 요청
            </button>
          )}
          {/* compose 뷰: 뒤로가기 버튼 */}
          {view === 'compose' && (
            <button
              type="button"
              onClick={() => setView('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                background: 'transparent',
                color: 'var(--w-text-soft)',
                border: '1px solid var(--w-border)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <ArrowLeft size={13} /> 뒤로
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              color: 'var(--w-text-muted)',
              border: 0,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* list 뷰: 적요 표 */}
        {view === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {transactions.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 12, color: 'var(--w-text-muted)' }}>
                거래가 없습니다.
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>일자</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>적요</th>
                    {/* 팀원 모달일 때만 카테고리 컬럼 표시 (카테고리 모달은 동일 카테고리라 무의미) */}
                    {variant === 'member' && <th style={thStyle}>카테고리</th>}
                    <th style={thStyle}>금액</th>
                    <th style={thStyle}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => {
                    const cat = variant === 'member' ? classifyByPurpose(t.memo, t.acctCode) : null;
                    return (
                      <tr key={`${t.ea || i}-${i}`}>
                        <td style={{ ...tdStyle, color: 'var(--w-text-muted)', whiteSpace: 'nowrap' }}>
                          {t.regDate?.slice(5) ?? '-'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'left' }} title={t.memo}>
                          {t.memo || '(적요 없음)'}
                        </td>
                        {cat && (
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                background: `${cat.color}1a`,
                                color: cat.color,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: 999, background: cat.color }} />
                              {cat.label}
                            </span>
                          </td>
                        )}
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{fmt(t.amount)}</td>
                        <td style={{ ...tdStyle, color: 'var(--w-text-muted)' }}>{t.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* compose 뷰: 적요 수정 요청 작성 폼 */}
        {view === 'compose' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--w-surface-2)',
                borderRadius: 8,
                fontSize: 11.5,
                color: 'var(--w-text-soft)',
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              현재 <b style={{ color: 'var(--w-text)' }}>'{categoryLabel}'</b> 카테고리로 분류된 거래
              <b style={{ color: 'var(--w-text)' }}> {transactions.length}건</b>에 대해
              어떤 점이 잘못 분류됐는지, 어떤 카테고리/키워드가 필요한지 적어주세요.
              <br />
              사이트 제보로 접수되며 관리자가 확인 후 분류 키워드를 보완합니다.
            </div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--w-text-soft)',
                marginBottom: 6,
              }}
            >
              요청 내용
            </label>
            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              rows={6}
              placeholder="예) 야근 식대인데 '회의'로 잡혀 있어요. '야간 PM' 키워드를 야근 카테고리에 추가해주세요."
              style={{
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setView('list')}
                className="w-btn w-btn-ghost"
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => { void handleSubmitReport(); }}
                disabled={submitting || !reportContent.trim()}
                className="w-btn"
                style={{
                  background: 'var(--w-accent)',
                  color: '#fff',
                  border: 0,
                  fontWeight: 700,
                  opacity: submitting || !reportContent.trim() ? 0.5 : 1,
                }}
              >
                <Check size={13} />
                {submitting ? '접수 중...' : '사이트 제보로 접수'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'right',
  fontSize: 10.5,
  fontWeight: 600,
  color: 'var(--w-text-muted)',
  background: 'var(--w-surface-2)',
  borderBottom: '1px solid var(--w-border)',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'right',
  borderBottom: '1px solid var(--w-border)',
};
