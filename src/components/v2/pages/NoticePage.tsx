import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Pin, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNotices } from '../../../hooks/useNotices';
import { URGENCY_LEVELS, NOTICE_CATEGORIES, TEAMS } from '../../../lib/constants';
import type { UrgencyLevel, NoticeCategory } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import type { Notice } from '../../../types';

export default function NoticePage() {
  const { user, profile } = useAuthStore();
  const perm = usePermissions();
  const {
    notices,
    loading,
    readIds,
    fetchNotices,
    fetchMyReads,
    markAsRead,
    createNotice,
    deleteNotice,
  } = useNotices();

  const [urgency, setUrgency] = useState<UrgencyLevel | null>(null);
  const [category, setCategory] = useState<NoticeCategory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Notice | null>(null);

  useEffect(() => {
    void fetchNotices({ urgency, category });
  }, [urgency, category, fetchNotices]);

  useEffect(() => {
    if (user) void fetchMyReads(user.id);
  }, [user, fetchMyReads]);

  const canWrite = perm.canWriteNotice;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          {
            label: '공지사항',
            badge: perm.isAdmin
              ? { text: '전사', tone: 'accent' }
              : perm.isLeaderOnly
                ? { text: '내 팀', tone: 'info' }
                : undefined,
          },
        ]}
        title="공지사항"
        description="긴급·할일·참고 공지를 한곳에서 확인하세요. 미확인 긴급 공지는 로그인 직후 랜딩에서 먼저 안내됩니다."
        actions={
          canWrite && (
            <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              <span>공지 작성</span>
            </button>
          )
        }
      />

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <FilterBar
          label="시급성"
          value={urgency}
          onChange={setUrgency}
          options={[
            { value: null, label: '전체' },
            ...URGENCY_LEVELS.map((u) => ({ value: u as UrgencyLevel, label: u })),
          ]}
        />
        <FilterBar
          label="카테고리"
          value={category}
          onChange={setCategory}
          options={[
            { value: null, label: '전체' },
            ...NOTICE_CATEGORIES.map((c) => ({ value: c as NoticeCategory, label: c })),
          ]}
        />
      </div>

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : notices.length === 0 ? (
        <div className="w-card">
          <EmptyState
            icon={Megaphone}
            title="표시할 공지가 없어요"
            description="필터를 바꾸거나, 새 공지를 작성해 보세요."
          />
        </div>
      ) : (
        <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
          {notices.map((n, i) => {
            const isRead = readIds.has(n.id);
            return (
              <button
                key={n.id}
                onClick={() => {
                  setDetail(n);
                  if (user && !isRead) void markAsRead(n.id, user.id);
                }}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '14px 16px',
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  borderTop: i === 0 ? 'none' : '1px solid var(--w-border)',
                  cursor: 'pointer',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface-2)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {n.pinned && <Pin size={14} color="var(--w-accent-hover)" />}
                  <UrgencyBadge urgency={n.urgency} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isRead ? 500 : 700,
                      color: isRead ? 'var(--w-text-soft)' : 'var(--w-text)',
                      marginBottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--w-text-muted)' }}>
                    <span>{n.category}</span>
                    {n.team && (
                      <>
                        <span>·</span>
                        <span>{n.team}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatRelativeTime(n.created_at)}</span>
                    {!isRead && <span className="w-badge w-badge-accent" style={{ marginLeft: 4 }}>미확인</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showCreate && canWrite && profile && (
        <CreateNoticeModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          defaultTeam={perm.isLeaderOnly ? profile.team : null}
          onSubmit={async (input) => {
            const { error } = await createNotice({
              ...input,
              author_id: user!.id,
            });
            if (!error) {
              setShowCreate(false);
              await fetchNotices({ urgency, category });
            } else {
              alert(`등록 실패: ${error}`);
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
          footer={
            <>
              {(perm.isAdmin || detail.author_id === user?.id) && (
                <button
                  className="w-btn w-btn-ghost"
                  style={{ color: 'var(--w-danger)' }}
                  onClick={async () => {
                    if (!confirm('공지를 삭제하시겠어요?')) return;
                    const { error } = await deleteNotice(detail.id);
                    if (error) alert(`삭제 실패: ${error}`);
                    else setDetail(null);
                  }}
                >
                  <Trash2 size={14} />
                  <span>삭제</span>
                </button>
              )}
              <button className="w-btn w-btn-primary" onClick={() => setDetail(null)}>
                닫기
              </button>
            </>
          }
        >
          <NoticeDetailView notice={detail} />
        </Modal>
      )}
    </>
  );
}

function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  if (urgency === '긴급') return <span className="w-badge w-badge-critical">긴급</span>;
  if (urgency === '할일') return <span className="w-badge w-badge-todo">할 일</span>;
  return <span className="w-badge w-badge-info">참고</span>;
}

function NoticeDetailView({ notice }: { notice: Notice }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <UrgencyBadge urgency={notice.urgency} />
        <span className="w-badge w-badge-muted">{notice.category}</span>
        {notice.team && <span className="w-badge w-badge-muted">{notice.team}</span>}
        {notice.pinned && <span className="w-badge w-badge-accent">고정</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>
        {formatRelativeTime(notice.created_at)} · 조회 {notice.view_count}
      </div>
      <div style={{ fontSize: 14, color: 'var(--w-text)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
        {notice.content}
      </div>
    </div>
  );
}

function CreateNoticeModal({
  open,
  onClose,
  onSubmit,
  defaultTeam,
}: {
  open: boolean;
  onClose: () => void;
  defaultTeam: string | null;
  onSubmit: (input: {
    title: string;
    content: string;
    urgency: UrgencyLevel;
    category: NoticeCategory;
    pinned: boolean;
    team: string | null;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('참고');
  const [category, setCategory] = useState<NoticeCategory>('일반');
  const [pinned, setPinned] = useState(false);
  const [team, setTeam] = useState<string | null>(defaultTeam);
  const [submitting, setSubmitting] = useState(false);

  const teamOptions = useMemo(
    () => [{ value: null, label: '전사' }, ...TEAMS.map((t) => ({ value: t as string, label: t }))],
    [],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 공지 작성"
      width={560}
      footer={
        <>
          <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>
            취소
          </button>
          <button
            className="w-btn w-btn-primary"
            disabled={!title.trim() || !content.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit({ title: title.trim(), content: content.trim(), urgency, category, pinned, team });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목"
            maxLength={120}
          />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Field label="시급성">
            <select value={urgency} onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}>
              {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="카테고리">
            <select value={category} onChange={(e) => setCategory(e.target.value as NoticeCategory)}>
              {NOTICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="대상">
            <select
              value={team ?? ''}
              onChange={(e) => setTeam(e.target.value || null)}
              disabled={!!defaultTeam}
            >
              {teamOptions.map((o) => (
                <option key={o.label} value={o.value ?? ''}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--w-text-soft)' }}>
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            style={{ width: 'auto', padding: 0 }}
          />
          <Pin size={14} /> 상단 고정
        </label>
        <Field label="내용">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="공지 내용을 작성해주세요"
          />
        </Field>
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
