import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Pin, Plus, Calendar, Eye, Building2 } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import { DetailBadges, MetaRow, DetailBody, AttachmentsGrid, DetailPanelHeader } from '../ui/DetailShell';
import MasterDetail, { MasterListCard, MasterListItem } from '../ui/MasterDetail';
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
            badge: profile?.team ? { text: profile.team, tone: 'accent' } : undefined,
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
        <MasterDetail
          hasSelection={!!detail}
          onBackMobile={() => setDetail(null)}
          emptyTitle="공지를 선택하세요"
          emptyDescription="왼쪽 목록에서 공지를 선택하면 내용이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {notices.map((n) => {
                const isRead = readIds.has(n.id);
                const selected = detail?.id === n.id;
                return (
                  <MasterListItem
                    key={n.id}
                    selected={selected}
                    onClick={() => {
                      setDetail(n);
                      if (user && !isRead) void markAsRead(n.id, user.id);
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {n.pinned && <Pin size={13} color="var(--w-accent-hover)" />}
                      <UrgencyBadge urgency={n.urgency} />
                      {!isRead && (
                        <span
                          aria-label="미확인"
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--w-accent)',
                            marginLeft: 'auto',
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: isRead ? 500 : 700,
                        color: isRead ? 'var(--w-text-soft)' : 'var(--w-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {n.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--w-text-muted)' }}>
                      <span>{n.category}</span>
                      {n.team && (
                        <>
                          <span>·</span>
                          <span>{n.team}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatRelativeTime(n.created_at)}</span>
                    </div>
                  </MasterListItem>
                );
              })}
            </MasterListCard>
          }
          detail={
            detail && (
              <NoticeDetailPanel
                notice={detail}
                canDelete={perm.isAdmin || detail.author_id === user?.id}
                onClose={() => setDetail(null)}
                onDelete={async () => {
                  if (!confirm('공지를 삭제하시겠어요?')) return;
                  const { error } = await deleteNotice(detail.id);
                  if (error) alert(`삭제 실패: ${error}`);
                  else setDetail(null);
                }}
              />
            )
          }
        />
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
    </>
  );
}

function NoticeDetailPanel({
  notice,
  canDelete,
  onDelete,
}: {
  notice: Notice;
  canDelete: boolean;
  onDelete: () => void;
  onClose: () => void; // 시그니처 호환
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DetailPanelHeader title={notice.title} canDelete={canDelete} onDelete={onDelete} />
      <NoticeDetailView notice={notice} />
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  if (urgency === '긴급') return <span className="w-badge w-badge-critical">긴급</span>;
  if (urgency === '할일') return <span className="w-badge w-badge-todo">할 일</span>;
  return <span className="w-badge w-badge-info">참고</span>;
}

function NoticeDetailView({ notice }: { notice: Notice }) {
  const metaItems = [
    { icon: <Calendar size={13} />, label: '게시일', value: formatRelativeTime(notice.created_at) },
    { icon: <Eye size={13} />, label: '조회', value: notice.view_count },
    ...(notice.team ? [{ icon: <Building2 size={13} />, label: '대상', value: notice.team }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DetailBadges>
        <UrgencyBadge urgency={notice.urgency} />
        <span className="w-badge w-badge-muted">{notice.category}</span>
        {notice.pinned && (
          <span className="w-badge w-badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Pin size={10} /> 고정
          </span>
        )}
      </DetailBadges>

      <MetaRow items={metaItems} />

      <DetailBody>{notice.content}</DetailBody>

      <AttachmentsGrid urls={notice.attachment_urls} />
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
