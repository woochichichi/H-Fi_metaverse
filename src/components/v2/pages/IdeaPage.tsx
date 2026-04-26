import { useEffect, useState } from 'react';
import { Lightbulb, Plus, ThumbsUp, Sprout, Heart, Workflow } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import PanelShell, { PanelFoot } from '../ui/PanelShell';
import IntroNotice from '../ui/IntroNotice';
import { StatusPicker, type StatusTone } from '../ui/DetailShell';
import {
  PostHeaderCard,
  WorkflowStepper,
  DescriptionCard,
  ComposerCard,
} from '../ui/PostDetail';
import MasterDetail, { MasterListCard, MasterListItem } from '../ui/MasterDetail';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useIdeas } from '../../../hooks/useIdeas';
import { IDEA_CATEGORIES, IDEA_STATUSES } from '../../../lib/constants';
import type { IdeaCategory, IdeaStatus } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import { useV2Toast } from '../ui/Toast';
import type { IdeaWithVotes } from '../../../types';

export default function IdeaPage() {
  const { user } = useAuthStore();
  const perm = usePermissions();
  const showToast = useV2Toast((s) => s.show);
  const { ideas, loading, fetchIdeas, fetchUserVotes, createIdea, toggleVote, updateIdeaStatus } = useIdeas();
  const [category, setCategory] = useState<IdeaCategory | null>(null);
  const [status, setStatus] = useState<IdeaStatus | null>(null);
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<IdeaWithVotes | null>(null);

  useEffect(() => {
    void fetchIdeas({ category, status, sort }).then(async () => {
      if (user) await fetchUserVotes(user.id);
    });
  }, [category, status, sort, fetchIdeas, fetchUserVotes, user]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: '한울타리' }, { label: '아이디어' }]}
        title="아이디어"
        description="업무를 더 낫게 만들 아이디어를 자유롭게 공유해요. 공감 투표로 우선순위를 만듭니다."
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>아이디어 올리기</span>
          </button>
        }
      />

      <IntroNotice
        items={[
          {
            icon: Sprout,
            iconColor: 'var(--w-success)',
            title: '작은 아이디어도 환영',
            body: (
              <>
                "이러면 좋겠다" 정도의 가벼운 생각도 OK. 완성된 기획서일 필요 없습니다. 배경 한 줄 +
                바라는 변화 한 줄이면 충분해요. 같은 고민을 하는 동료가 의외로 많습니다.
              </>
            ),
          },
          {
            icon: Heart,
            iconColor: 'var(--w-accent)',
            title: '공감으로 우선순위가 정해져요',
            body: (
              <>
                좋은 아이디어에 <b>공감</b>(❤️) 눌러주세요. 공감 수가 많은 안건부터 리더가 검토합니다.
                "내 아이디어가 아니어도" 응원 의사 표현이라 생각하고 적극 눌러주세요.
              </>
            ),
          },
          {
            icon: Workflow,
            iconColor: 'var(--w-info)',
            title: '제안 → 검토 → 채택 → 진행 → 완료',
            body: (
              <>
                상태 단계별로 진행 상황을 추적합니다. 채택된 아이디어는 누가 언제 진행하는지 함께
                노출돼요. 반려된 경우 사유도 우측 상세에서 확인할 수 있습니다.
              </>
            ),
          },
        ]}
      />

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <FilterBar
          label="카테고리"
          value={category}
          onChange={setCategory}
          options={[{ value: null, label: '전체' }, ...IDEA_CATEGORIES.map((c) => ({ value: c as IdeaCategory, label: c }))]}
        />
        <FilterBar
          label="상태"
          value={status}
          onChange={setStatus}
          options={[{ value: null, label: '전체' }, ...IDEA_STATUSES.map((s) => ({ value: s as IdeaStatus, label: s }))]}
        />
        <FilterBar
          label="정렬"
          value={sort}
          onChange={(v) => setSort((v as 'newest' | 'popular') ?? 'newest')}
          options={[
            { value: 'newest' as const, label: '최신순' },
            { value: 'popular' as const, label: '인기순' },
          ]}
        />
      </div>

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : ideas.length === 0 ? (
        <div className="w-card">
          <EmptyState icon={Lightbulb} title="아직 등록된 아이디어가 없어요" description="작은 아이디어도 환영해요 💡" />
        </div>
      ) : (
        <MasterDetail
          hasSelection={showCreate || !!detail}
          onBackMobile={() => {
            setShowCreate(false);
            setDetail(null);
          }}
          emptyTitle="아이디어를 선택하세요"
          emptyDescription="왼쪽 목록에서 하나를 선택하면 상세와 공감 현황이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {ideas.map((idea) => {
                const voted = !!(idea as IdeaWithVotes & { _voted?: boolean })._voted;
                const selected = !showCreate && detail?.id === idea.id;
                return (
                  <MasterListItem
                    key={idea.id}
                    selected={selected}
                    onClick={() => {
                      setShowCreate(false);
                      setDetail(idea);
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {idea.category && <span className="w-badge w-badge-muted">{idea.category}</span>}
                      <StatusBadge status={idea.status} />
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (user) await toggleVote(idea.id, user.id);
                        }}
                        className="w-btn"
                        style={{
                          marginLeft: 'auto',
                          padding: '3px 8px',
                          fontSize: 11,
                          background: voted ? 'var(--w-accent-soft)' : 'var(--w-surface-2)',
                          color: voted ? 'var(--w-accent-hover)' : 'var(--w-text-soft)',
                          fontWeight: 600,
                        }}
                        title={voted ? '공감 취소' : '공감'}
                      >
                        <ThumbsUp size={11} />
                        <span>{idea.vote_count}</span>
                      </button>
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
                      {idea.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                      {formatRelativeTime(idea.created_at)}
                    </div>
                  </MasterListItem>
                );
              })}
            </MasterListCard>
          }
          detail={
            showCreate && user ? (
              <CreateIdeaPanel
                onClose={() => setShowCreate(false)}
                onSubmit={async (input) => {
                  const { error } = await createIdea({ ...input, author_id: user.id });
                  if (error) {
                    showToast(`등록 실패: ${error}`, 'error');
                    return;
                  }
                  setShowCreate(false);
                  await fetchIdeas({ category, status, sort });
                  await fetchUserVotes(user.id);
                  showToast('아이디어가 등록되었습니다', 'success');
                }}
              />
            ) : detail ? (
              <IdeaDetailPanel
                idea={detail}
                voted={!!(detail as IdeaWithVotes & { _voted?: boolean })._voted}
                canChangeStatus={perm.canChangeIdeaStatus}
                onClose={() => setDetail(null)}
                onVote={async () => {
                  if (user) await toggleVote(detail.id, user.id);
                }}
                onStatusChange={async (s) => {
                  const { error } = await updateIdeaStatus(detail.id, s);
                  if (error) showToast(`변경 실패: ${error}`, 'error');
                  else setDetail({ ...detail, status: s });
                }}
              />
            ) : null
          }
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: IdeaStatus }) {
  const map: Record<IdeaStatus, { cls: string; label: string }> = {
    '제안': { cls: 'w-badge w-badge-info', label: '제안' },
    '검토': { cls: 'w-badge w-badge-todo', label: '검토' },
    '채택': { cls: 'w-badge w-badge-accent', label: '채택' },
    '진행중': { cls: 'w-badge w-badge-accent', label: '진행중' },
    '완료': { cls: 'w-badge', label: '완료' },
    '반려': { cls: 'w-badge w-badge-muted', label: '반려' },
  };
  const it = map[status];
  const style = status === '완료' ? { background: 'var(--w-success-soft)', color: 'var(--w-success)' } : undefined;
  return <span className={it.cls} style={style}>{it.label}</span>;
}

const IDEA_STATUS_TONE: Record<IdeaStatus, StatusTone> = {
  '제안': 'neutral',
  '검토': 'todo',
  '채택': 'accent',
  '진행중': 'accent',
  '완료': 'success',
  '반려': 'danger',
};

function IdeaDetailPanel({
  idea,
  voted,
  onVote,
  canChangeStatus,
  onStatusChange,
}: {
  idea: IdeaWithVotes;
  voted: boolean;
  onVote: () => Promise<void>;
  onClose: () => void; // 시그니처 호환용
  canChangeStatus: boolean;
  onStatusChange: (s: IdeaStatus) => Promise<void>;
}) {
  // 반려는 별도 분기 (5단계 stepper 대신 표시 안 함)
  const isRejected = idea.status === '반려';
  const flowSteps: { key: IdeaStatus; label: string }[] = [
    { key: '제안', label: '제안' },
    { key: '검토', label: '검토' },
    { key: '채택', label: '채택' },
    { key: '진행중', label: '진행중' },
    { key: '완료', label: '완료' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PostHeaderCard
        icon={<Lightbulb size={22} />}
        iconTone={
          idea.status === '완료'
            ? 'success'
            : idea.status === '반려'
              ? 'crit'
              : idea.status === '채택' || idea.status === '진행중'
                ? 'accent'
                : 'todo'
        }
        badgeId={`IDEA-${idea.id.slice(0, 6)}`}
        badges={
          <>
            {idea.category && <span className="w-badge w-badge-muted">{idea.category}</span>}
            <StatusBadge status={idea.status} />
          </>
        }
        title={idea.title}
        metaLine={
          <>
            <span>작성자</span>
            <span>·</span>
            <span>{formatRelativeTime(idea.created_at)}</span>
            <span>·</span>
            <span>조회 {idea.view_count}</span>
            <span>·</span>
            <span>공감 {idea.vote_count}</span>
          </>
        }
        extraActions={
          <button
            onClick={() => {
              void onVote();
            }}
            className="w-btn"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: voted ? 'var(--w-accent)' : 'var(--w-surface-2)',
              color: voted ? '#fff' : 'var(--w-text-soft)',
              fontWeight: 700,
              border: voted ? '1px solid var(--w-accent)' : '1px solid var(--w-border)',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            title={voted ? '공감 취소' : '공감'}
          >
            <ThumbsUp size={13} />
            <span>{idea.vote_count}</span>
          </button>
        }
      />

      {!isRejected && (
        <WorkflowStepper<IdeaStatus>
          title="아이디어 진행"
          steps={flowSteps}
          currentKey={idea.status === '반려' ? '제안' : idea.status}
          quickActions={
            canChangeStatus && (
              <>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-text-muted)' }}>
                  빠른 진행 →
                </span>
                {IDEA_STATUSES.filter((s) => s !== idea.status).map((s) => (
                  <button
                    key={s}
                    className="w-btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      background: s === '완료' ? 'var(--w-accent)' : 'var(--w-surface-2)',
                      color: s === '완료' ? '#fff' : 'var(--w-text-soft)',
                      border:
                        s === '완료' ? '1px solid var(--w-accent)' : '1px solid var(--w-border)',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      void onStatusChange(s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </>
            )
          }
        />
      )}

      <DescriptionCard label="아이디어 내용" timestamp={formatRelativeTime(idea.created_at)}>
        {idea.description}
      </DescriptionCard>

      {canChangeStatus && (
        <ComposerCard
          label="리더 처리 — 상태 변경"
          topActions={
            <div style={{ marginLeft: 'auto' }}>
              <StatusPicker<IdeaStatus>
                current={idea.status}
                options={[...IDEA_STATUSES]}
                toneOf={(s) => IDEA_STATUS_TONE[s]}
                onChange={(s) => {
                  void onStatusChange(s);
                }}
              />
            </div>
          }
        />
      )}
    </div>
  );
}

function CreateIdeaPanel({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: { title: string; description: string; category: IdeaCategory }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('업무개선');
  const [submitting, setSubmitting] = useState(false);

  return (
    <PanelShell title="아이디어 올리기" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 18px' }}>
        <Field label="카테고리">
          <select value={category} onChange={(e) => setCategory(e.target.value as IdeaCategory)}>
            {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="제목">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="예) 주간회의를 격주로 줄이면 어떨까요?" />
        </Field>
        <Field label="설명">
          <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="배경·아이디어 내용·기대 효과" />
        </Field>
      </div>
      <PanelFoot>
        <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>취소</button>
        <button
          className="w-btn w-btn-primary"
          disabled={!title.trim() || !description.trim() || submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              await onSubmit({ title: title.trim(), description: description.trim(), category });
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
