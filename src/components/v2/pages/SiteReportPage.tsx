import { useEffect, useState } from 'react';
import { Bug, Plus } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import { usePermissions } from '../../../hooks/usePermissions';
import { useSiteReports } from '../../../hooks/useSiteReports';
import { formatRelativeTime } from '../../../lib/utils';
import type { SiteReport } from '../../../types/database';

export default function SiteReportPage() {
  const perm = usePermissions();
  const { reports, authorNames, loading, fetchMyReports, fetchAllReports, createReport } = useSiteReports();

  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<SiteReport | null>(null);

  useEffect(() => {
    if (perm.isSuperAdmin) void fetchAllReports();
    else void fetchMyReports();
  }, [perm.isSuperAdmin, fetchAllReports, fetchMyReports]);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          { label: '사이트 제보', badge: perm.isSuperAdmin ? { text: '관리자 · 전체', tone: 'accent' } : undefined },
        ]}
        title="사이트 제보"
        description={
          perm.isSuperAdmin
            ? '사용자들이 보낸 모든 제보를 확인해요. 브라우저·콘솔 로그가 함께 첨부됩니다.'
            : '페이지 오류나 개선 아이디어를 관리자에게 전해주세요. 하루 최대 3건 제출 가능합니다.'
        }
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>제보하기</span>
          </button>
        }
      />

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : reports.length === 0 ? (
        <div className="w-card">
          <EmptyState icon={Bug} title="제보가 없어요" />
        </div>
      ) : (
        <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
          {reports.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setDetail(r)}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 16px',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                borderTop: i === 0 ? 'none' : '1px solid var(--w-border)',
                cursor: 'pointer',
                alignItems: 'flex-start',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface-2)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <ReportStatusBadge status={r.status} />
                  {perm.isSuperAdmin && authorNames[r.author_id] && (
                    <span className="w-badge w-badge-muted">{authorNames[r.author_id]}</span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--w-text)', marginBottom: 3 }}>
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--w-text-soft)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {r.content}
                </div>
                <div style={{ fontSize: 11, color: 'var(--w-text-muted)', marginTop: 4 }}>
                  {formatRelativeTime(r.created_at)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateReportModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={async ({ title, content }) => {
            const { error } = await createReport({ title, content });
            if (error) alert(error);
            else {
              setShowCreate(false);
              if (perm.isSuperAdmin) await fetchAllReports();
              else await fetchMyReports();
            }
          }}
        />
      )}

      {detail && (
        <Modal
          open
          onClose={() => setDetail(null)}
          title={detail.title}
          width={640}
          footer={<button className="w-btn w-btn-primary" onClick={() => setDetail(null)}>닫기</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <ReportStatusBadge status={detail.status} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>
              {formatRelativeTime(detail.created_at)}
              {perm.isSuperAdmin && authorNames[detail.author_id] && ` · ${authorNames[detail.author_id]}`}
            </div>
            <div style={{ fontSize: 14, color: 'var(--w-text)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {detail.content}
            </div>
            {perm.isSuperAdmin && (
              <div
                style={{
                  padding: 12,
                  background: 'var(--w-surface-2)',
                  borderRadius: 'var(--w-radius-sm)',
                  fontSize: 11,
                  color: 'var(--w-text-muted)',
                  fontFamily: 'monospace',
                  lineHeight: 1.6,
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                <div>URL: {detail.current_url}</div>
                <div>Screen: {detail.screen_size}</div>
                <div>UA: {detail.user_agent}</div>
                {detail.console_logs && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--w-text-soft)' }}>콘솔 로그</summary>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{detail.console_logs}</pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function ReportStatusBadge({ status }: { status: SiteReport['status'] }) {
  if (status === '완료') return <span className="w-badge" style={{ background: 'var(--w-success-soft)', color: 'var(--w-success)' }}>완료</span>;
  if (status === '처리중') return <span className="w-badge w-badge-accent">처리중</span>;
  if (status === '확인') return <span className="w-badge w-badge-todo">확인</span>;
  return <span className="w-badge w-badge-info">접수</span>;
}

function CreateReportModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; content: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="사이트 제보"
      width={520}
      footer={
        <>
          <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button
            className="w-btn w-btn-primary"
            disabled={!title.trim() || !content.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit({ title: title.trim(), content: content.trim() });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? '전송 중...' : '제출'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="제목"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="간단히 요약해주세요" /></Field>
        <Field label="내용">
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="어떤 문제가 있었나요? 재현 단계, 기대 동작, 기기/브라우저 등 자세할수록 좋아요."
          />
        </Field>
        <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
          제출 시 현재 URL·화면 크기·콘솔 로그가 자동으로 첨부됩니다.
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--w-text-soft)' }}>{label}</span>
      {children}
    </label>
  );
}
