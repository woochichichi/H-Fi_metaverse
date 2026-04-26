import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Pin, Plus, AlertCircle, Eye, Bell } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import PanelShell, { PanelFoot } from '../ui/PanelShell';
import IntroNotice from '../ui/IntroNotice';
import { PostHeaderCard, DescriptionCard } from '../ui/PostDetail';
import MasterDetail, { MasterListCard, MasterListItem } from '../ui/MasterDetail';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNotices } from '../../../hooks/useNotices';
import { URGENCY_LEVELS, NOTICE_CATEGORIES, TEAMS } from '../../../lib/constants';
import type { UrgencyLevel, NoticeCategory } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import { useV2Toast } from '../ui/Toast';
import { confirm } from '../ui/dialog';
import type { Notice } from '../../../types';

export default function NoticePage() {
  const { user, profile } = useAuthStore();
  const perm = usePermissions();
  const showToast = useV2Toast((s) => s.show);
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
            label: '공지',
            badge: profile?.team ? { text: profile.team, tone: 'accent' } : undefined,
          },
        ]}
        title="공지"
        description="팀 전체가 알아야 할 소식이에요. 긴급·할일·참고 시급성별로 확인하세요. (작성은 리더·관리자 권한)"
        actions={
          canWrite && (
            <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              <span>공지 작성</span>
            </button>
          )
        }
      />

      <IntroNotice
        items={[
          {
            icon: AlertCircle,
            iconColor: 'var(--w-danger)',
            title: '시급성 표기를 꼭 봐주세요',
            body: (
              <>
                <b>긴급</b>은 즉시 확인이 필요한 사안, <b>할일</b>은 본인 액션이 필요한 안내,
                <b> 참고</b>는 알아두면 좋은 정보예요. 헤더의 시급성 필터로 빠르게 추릴 수 있습니다.
              </>
            ),
          },
          {
            icon: Eye,
            iconColor: 'var(--w-success)',
            title: '읽음 표시는 자동입니다',
            body: (
              <>
                목록에서 공지를 열면 자동으로 "읽음"으로 처리됩니다. 미확인 공지에는 좌측에 작은
                <b> 빨간 점</b>이 보이니, 그것만 따라가도 놓치는 게 없어요.
              </>
            ),
          },
          {
            icon: Bell,
            iconColor: 'var(--w-accent)',
            title: '작성은 리더·관리자',
            body: (
              <>
                작성 권한은 리더·담당·관리자 전용. 작성 시 <b>대상</b>과 <b>시급성</b>을 신중히 정해주세요.
                긴급 남발은 알림 피로를 키워 정작 중요한 공지가 묻힙니다.
              </>
            ),
          },
        ]}
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
            title="최근 공지가 없어요 📢"
            description="필터를 바꾸거나, 새 공지를 작성해 보세요."
          />
        </div>
      ) : (
        <MasterDetail
          hasSelection={showCreate || !!detail}
          onBackMobile={() => {
            setShowCreate(false);
            setDetail(null);
          }}
          emptyTitle="공지를 선택하세요"
          emptyDescription="왼쪽 목록에서 공지를 선택하면 내용이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {notices.map((n) => {
                const isRead = readIds.has(n.id);
                const selected = !showCreate && detail?.id === n.id;
                return (
                  <MasterListItem
                    key={n.id}
                    selected={selected}
                    onClick={() => {
                      setShowCreate(false);
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
            showCreate && canWrite && profile && user ? (
              <CreateNoticePanel
                defaultTeam={perm.isLeaderOnly ? profile.team : null}
                onClose={() => setShowCreate(false)}
                onSubmit={async (input) => {
                  const { error } = await createNotice({
                    ...input,
                    author_id: user.id,
                  });
                  if (error) {
                    showToast(`등록 실패: ${error}`, 'error');
                    return;
                  }
                  setShowCreate(false);
                  await fetchNotices({ urgency, category });
                  showToast('공지가 등록되었습니다', 'success');
                }}
              />
            ) : detail ? (
              <NoticeDetailPanel
                notice={detail}
                canDelete={perm.isAdmin || detail.author_id === user?.id}
                onClose={() => setDetail(null)}
                onDelete={async () => {
                  const ok = await confirm({ title: '공지 삭제', message: '공지를 삭제하시겠어요?' });
                  if (!ok) return;
                  const { error } = await deleteNotice(detail.id);
                  if (error) showToast(`삭제 실패: ${error}`, 'error');
                  else setDetail(null);
                }}
              />
            ) : null
          }
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
  const tone =
    notice.urgency === '긴급' ? 'crit' : notice.urgency === '할일' ? 'todo' : 'info';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PostHeaderCard
        icon={<Megaphone size={22} />}
        iconTone={tone}
        badgeId={`NOTICE-${notice.id.slice(0, 6)}`}
        badges={
          <>
            <UrgencyBadge urgency={notice.urgency} />
            <span className="w-badge w-badge-muted">{notice.category}</span>
            {notice.pinned && (
              <span
                className="w-badge w-badge-accent"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <Pin size={10} /> 고정
              </span>
            )}
          </>
        }
        title={notice.title}
        metaLine={
          <>
            <span>대상: {notice.team ?? '공통'}</span>
            <span>·</span>
            <span>{formatRelativeTime(notice.created_at)}</span>
            <span>·</span>
            <span>조회 {notice.view_count}</span>
          </>
        }
        canDelete={canDelete}
        onDelete={onDelete}
      />
      <DescriptionCard
        label="공지 내용"
        timestamp={formatRelativeTime(notice.created_at)}
        attachments={notice.attachment_urls}
      >
        {notice.content}
      </DescriptionCard>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  if (urgency === '긴급') return <span className="w-badge w-badge-critical">긴급</span>;
  if (urgency === '할일') return <span className="w-badge w-badge-todo">할 일</span>;
  return <span className="w-badge w-badge-info">참고</span>;
}

function CreateNoticePanel({
  onClose,
  onSubmit,
  defaultTeam,
}: {
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
    <PanelShell title="새 공지 작성" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 18px' }}>
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
      <PanelFoot>
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
      </PanelFoot>
    </PanelShell>
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
