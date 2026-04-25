import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X, MessageSquarePlus, Check } from 'lucide-react';
import { fmt, fmtKR, type CorpTransaction } from '../../../lib/corpCardMockData';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { useVocs } from '../../../hooks/useVocs';

interface Props {
  /** 모달 제목. 예: "전우형 · 7건" 또는 "기타 (미분류) · 19건" */
  title: string;
  /** 부제 (옵션). 예: "이번 분기 사용한 거래" */
  subtitle?: string;
  /** 표시할 거래 목록 */
  transactions: CorpTransaction[];
  /** 모달 종류 — 'category' 일 때만 "관리자에게 요청" 버튼 노출 */
  variant?: 'member' | 'category';
  /** category 이름 — 관리자 요청 메시지에 포함 */
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
  const { user, profile } = useAuthStore();
  const { createVoc } = useVocs();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const total = transactions.reduce((s, t) => s + t.amount, 0);

  const handleRequestAdmin = async () => {
    if (!user || !profile) {
      alert('로그인 정보가 없습니다.');
      return;
    }
    const memos = transactions.slice(0, 30).map((t) => `- ${t.memo} (${fmt(t.amount)}원)`).join('\n');
    const title = `[팀 예산] '${categoryLabel ?? '미분류'}' 카테고리 키워드 추가 요청`;
    const content =
      `아래 거래들이 '${categoryLabel ?? '미분류'}' 로 잡혀 있습니다.\n` +
      `적절한 카테고리로 분류될 수 있도록 키워드 추가를 요청합니다.\n\n` +
      `=== 거래 적요 (상위 ${Math.min(30, transactions.length)}건 / 총 ${transactions.length}건) ===\n${memos}`;

    setSubmitting(true);
    const { error } = await createVoc({
      anonymous: false,
      author_id: user.id,
      category: '개선',
      sub_category: '프로세스 개선',
      title,
      content,
      team: profile.team ?? '증권ITO',
      severity: 3,
    });
    setSubmitting(false);
    if (error) {
      alert(`VOC 등록 실패: ${error}`);
      return;
    }
    setSubmitted(true);
  };

  return createPortal(
    <div className={themeClass}>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.45)',
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
          {variant === 'category' && transactions.length > 0 && !submitted && (
            <button
              type="button"
              onClick={() => { void handleRequestAdmin(); }}
              disabled={submitting}
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
                cursor: submitting ? 'progress' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
              title="이 거래들의 적요를 모아 VOC 로 등록해 키워드 추가를 요청합니다"
            >
              <MessageSquarePlus size={13} />
              {submitting ? '등록 중...' : 'VOC 로 키워드 추가 요청'}
            </button>
          )}
          {submitted && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: 'var(--w-success-soft)',
                color: 'var(--w-success)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Check size={13} /> VOC 등록 완료
            </span>
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

        {/* 적요 리스트 */}
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
                  <th style={thStyle}>금액</th>
                  <th style={thStyle}>상태</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={`${t.ea || i}-${i}`}>
                    <td style={{ ...tdStyle, color: 'var(--w-text-muted)', whiteSpace: 'nowrap' }}>
                      {t.regDate?.slice(5) ?? '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left' }} title={t.memo}>
                      {t.memo || '(적요 없음)'}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{fmt(t.amount)}</td>
                    <td style={{ ...tdStyle, color: 'var(--w-text-muted)' }}>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
