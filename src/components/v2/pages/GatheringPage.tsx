import { useEffect, useState } from 'react';
import { PartyPopper, Plus, Users } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import {
  PostHeaderCard,
  WorkflowStepper,
  DescriptionCard,
  ReplyCard,
} from '../ui/PostDetail';
import MasterDetail, { MasterListCard, MasterListItem } from '../ui/MasterDetail';
import { useAuthStore } from '../../../stores/authStore';
import { useGatherings } from '../../../hooks/useGatherings';
import { GATHERING_CATEGORIES } from '../../../lib/constants';
import type { GatheringCategory } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import { useV2Toast } from '../ui/Toast';
import type { Gathering } from '../../../types';

export default function GatheringPage() {
  const { user } = useAuthStore();
  const { gatherings, loading, fetchGatherings, fetchMyJoins, createGathering, joinGathering, leaveGathering, closeGathering } = useGatherings();
  const showToast = useV2Toast((s) => s.show);

  const [category, setCategory] = useState<GatheringCategory | null>(null);
  const [status, setStatus] = useState<'recruiting' | 'closed' | 'completed' | null>('recruiting');
  const [myJoins, setMyJoins] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Gathering | null>(null);

  useEffect(() => {
    void fetchGatherings({ category, status });
  }, [category, status, fetchGatherings]);

  useEffect(() => {
    if (user) void fetchMyJoins(user.id).then(setMyJoins);
  }, [user, fetchMyJoins, gatherings]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: '한울타리' }, { label: '소모임' }]}
        title="소모임"
        description="사내 동호회·스터디·취미 모임. 관심 있는 모임에 참여해 보세요."
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>모임 만들기</span>
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <FilterBar
          label="카테고리"
          value={category}
          onChange={setCategory}
          options={[
            { value: null, label: '전체' },
            ...GATHERING_CATEGORIES.map((c) => ({ value: c as GatheringCategory, label: c })),
          ]}
        />
        <FilterBar
          label="상태"
          value={status}
          onChange={(v) => setStatus(v as 'recruiting' | 'closed' | 'completed' | null)}
          options={[
            { value: null, label: '전체' },
            { value: 'recruiting' as const, label: '모집중' },
            { value: 'closed' as const, label: '마감' },
            { value: 'completed' as const, label: '종료' },
          ]}
        />
      </div>

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : gatherings.length === 0 ? (
        <div className="w-card">
          <EmptyState icon={PartyPopper} title="열린 모임이 없어요" description="첫 모임을 만들어 보세요." />
        </div>
      ) : (
        <MasterDetail
          hasSelection={!!detail}
          onBackMobile={() => setDetail(null)}
          emptyTitle="모임을 선택하세요"
          emptyDescription="왼쪽 목록에서 하나를 선택하면 상세와 참여 현황이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {gatherings.map((g) => {
                const selected = detail?.id === g.id;
                const joined = myJoins.has(g.id);
                return (
                  <MasterListItem key={g.id} selected={selected} onClick={() => setDetail(g)}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="w-badge w-badge-muted">{g.category}</span>
                      <StatusBadge status={g.status} />
                      {joined && <span className="w-badge w-badge-accent">참여중</span>}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: 'var(--w-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {g.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--w-text-muted)' }}>
                      <Users size={11} />
                      <span>
                        {g.member_count}
                        {g.max_members ? ` / ${g.max_members}` : ''}명
                      </span>
                      <span>·</span>
                      <span>{formatRelativeTime(g.created_at)}</span>
                    </div>
                  </MasterListItem>
                );
              })}
            </MasterListCard>
          }
          detail={
            detail && user && (
              <GatheringDetailPanel
                gathering={detail}
                joined={myJoins.has(detail.id)}
                isAuthor={detail.author_id === user.id}
                onJoinToggle={async () => {
                  if (myJoins.has(detail.id)) await leaveGathering(detail.id, user.id);
                  else await joinGathering(detail.id, user.id);
                  const next = await fetchMyJoins(user.id);
                  setMyJoins(next);
                }}
                onCloseRecruit={async () => {
                  await closeGathering(detail.id);
                  setDetail(null);
                }}
              />
            )
          }
        />
      )}

      {showCreate && user && (
        <CreateGatheringModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={async (input) => {
            const { error } = await createGathering({ ...input, author_id: user.id });
            if (!error) {
              setShowCreate(false);
              await fetchGatherings({ category, status });
            } else showToast(`등록 실패: ${error}`, 'error');
          }}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: Gathering['status'] }) {
  if (status === 'recruiting') return <span className="w-badge w-badge-accent">모집중</span>;
  if (status === 'closed') return <span className="w-badge w-badge-muted">마감</span>;
  return <span className="w-badge" style={{ background: 'var(--w-success-soft)', color: 'var(--w-success)' }}>종료</span>;
}

function GatheringDetailPanel({
  gathering,
  joined,
  isAuthor,
  onJoinToggle,
  onCloseRecruit,
}: {
  gathering: Gathering;
  joined: boolean;
  isAuthor: boolean;
  onJoinToggle: () => Promise<void>;
  onCloseRecruit: () => Promise<void>;
}) {
  const isRecruiting = gathering.status === 'recruiting';
  const flowSteps: { key: Gathering['status']; label: string }[] = [
    { key: 'recruiting', label: '모집중' },
    { key: 'closed', label: '마감' },
    { key: 'completed', label: '종료' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PostHeaderCard
        icon={<PartyPopper size={22} />}
        iconTone={
          gathering.status === 'completed'
            ? 'success'
            : gathering.status === 'closed'
              ? 'muted'
              : 'accent'
        }
        badgeId={`MEET-${gathering.id.slice(0, 6)}`}
        badges={
          <>
            <span className="w-badge w-badge-muted">{gathering.category}</span>
            <StatusBadge status={gathering.status} />
            {joined && <span className="w-badge w-badge-accent">참여중</span>}
          </>
        }
        title={gathering.title}
        metaLine={
          <>
            <span>{isAuthor ? '내 모임' : '모임장'}</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} />
              {gathering.member_count}
              {gathering.max_members ? ` / ${gathering.max_members}` : ''}명
            </span>
            <span>·</span>
            <span>{formatRelativeTime(gathering.created_at)}</span>
            {gathering.deadline && (
              <>
                <span>·</span>
                <span>마감 {gathering.deadline}</span>
              </>
            )}
          </>
        }
        extraActions={
          <>
            {isAuthor && isRecruiting && (
              <button
                className="w-btn w-btn-ghost"
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={() => {
                  void onCloseRecruit();
                }}
              >
                모집 마감
              </button>
            )}
            {isRecruiting && (
              <button
                className={joined ? 'w-btn w-btn-ghost' : 'w-btn w-btn-primary'}
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => {
                  void onJoinToggle();
                }}
              >
                {joined ? '참여 취소' : '참여하기'}
              </button>
            )}
          </>
        }
      />

      <WorkflowStepper<Gathering['status']>
        title="모임 진행"
        steps={flowSteps}
        currentKey={gathering.status}
      />

      <DescriptionCard label="모임 소개" timestamp={formatRelativeTime(gathering.created_at)}>
        {gathering.description}
      </DescriptionCard>

      {gathering.contact_info && (
        <ReplyCard
          variant="system"
          avatarLabel=""
          authorName="문의처"
          timestamp={gathering.contact_info}
          tag="CONTACT"
        >
          {gathering.contact_info}
        </ReplyCard>
      )}
    </div>
  );
}

function CreateGatheringModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string;
    category: GatheringCategory;
    max_members: number | null;
    contact_info: string | null;
    deadline: string | null;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GatheringCategory>('스터디');
  const [maxMembers, setMaxMembers] = useState<string>('');
  const [contact, setContact] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="모임 만들기"
      width={560}
      footer={
        <>
          <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button
            className="w-btn w-btn-primary"
            disabled={!title.trim() || !description.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit({
                  title: title.trim(),
                  description: description.trim(),
                  category,
                  max_members: maxMembers ? Number(maxMembers) : null,
                  contact_info: contact.trim() || null,
                  deadline: deadline || null,
                });
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="카테고리">
            <select value={category} onChange={(e) => setCategory(e.target.value as GatheringCategory)}>
              {GATHERING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="정원 (선택)">
            <input
              type="number"
              min={1}
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              placeholder="무제한"
            />
          </Field>
          <Field label="모집 마감 (선택)">
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>
        <Field label="제목"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></Field>
        <Field label="소개"><textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="문의 (선택)"><input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="예: 슬랙 @홍길동" /></Field>
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
