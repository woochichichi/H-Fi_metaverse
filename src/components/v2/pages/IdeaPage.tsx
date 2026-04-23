import { useEffect, useState } from 'react';
import { Lightbulb, Plus, ThumbsUp, Calendar, Eye, Heart } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import {
  DetailBadges,
  MetaRow,
  DetailBody,
  SectionDivider,
  StatusPicker,
  type StatusTone,
} from '../ui/DetailShell';
import MasterDetail, { MasterListCard, MasterListItem } from '../ui/MasterDetail';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useIdeas } from '../../../hooks/useIdeas';
import { IDEA_CATEGORIES, IDEA_STATUSES } from '../../../lib/constants';
import type { IdeaCategory, IdeaStatus } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import type { IdeaWithVotes } from '../../../types';

export default function IdeaPage() {
  const { user } = useAuthStore();
  const perm = usePermissions();
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
        title="아이디어 제안"
        description="업무 개선·인적 교류·이벤트 아이디어를 제안하고, 공감 투표로 우선순위를 만들어요."
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>아이디어 제안</span>
          </button>
        }
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
          <EmptyState icon={Lightbulb} title="아직 아이디어가 없어요" description="첫 아이디어를 제안해보세요!" />
        </div>
      ) : (
        <MasterDetail
          hasSelection={!!detail}
          onBackMobile={() => setDetail(null)}
          emptyTitle="아이디어를 선택하세요"
          emptyDescription="왼쪽 목록에서 하나를 선택하면 상세와 공감 현황이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {ideas.map((idea) => {
                const voted = !!(idea as IdeaWithVotes & { _voted?: boolean })._voted;
                const selected = detail?.id === idea.id;
                return (
                  <MasterListItem key={idea.id} selected={selected} onClick={() => setDetail(idea)}>
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
            detail && (
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
                  if (error) alert(`변경 실패: ${error}`);
                  else setDetail({ ...detail, status: s });
                }}
              />
            )
          }
        />
      )}

      {showCreate && user && (
        <CreateIdeaModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={async (input) => {
            const { error } = await createIdea({ ...input, author_id: user.id });
            if (!error) {
              setShowCreate(false);
              await fetchIdeas({ category, status, sort });
              await fetchUserVotes(user.id);
            } else alert(`등록 실패: ${error}`);
          }}
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
  const style = status === '완료' ? { background: '#E8F5EE', color: 'var(--w-success)' } : undefined;
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
  onClose,
  canChangeStatus,
  onStatusChange,
}: {
  idea: IdeaWithVotes;
  voted: boolean;
  onVote: () => Promise<void>;
  onClose: () => void;
  canChangeStatus: boolean;
  onStatusChange: (s: IdeaStatus) => Promise<void>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--w-text)',
            flex: 1,
            lineHeight: 1.35,
          }}
        >
          {idea.title}
        </h2>
        <button
          onClick={() => { void onVote(); }}
          className="w-btn"
          style={{
            padding: '6px 12px',
            fontSize: 12,
            background: voted ? 'var(--w-accent)' : 'var(--w-surface-2)',
            color: voted ? '#fff' : 'var(--w-text-soft)',
            fontWeight: 700,
            border: voted ? '1px solid var(--w-accent)' : '1px solid var(--w-border)',
          }}
          title={voted ? '공감 취소' : '공감'}
        >
          <ThumbsUp size={13} />
          <span>{idea.vote_count}</span>
        </button>
        <button
          className="w-btn w-btn-ghost"
          style={{ padding: '6px 10px', fontSize: 12 }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>

      <DetailBadges>
        {idea.category && <span className="w-badge w-badge-muted">{idea.category}</span>}
        <StatusBadge status={idea.status} />
      </DetailBadges>

      <MetaRow
        items={[
          { icon: <Calendar size={13} />, label: '제안일', value: formatRelativeTime(idea.created_at) },
          { icon: <Eye size={13} />, label: '조회', value: idea.view_count },
          { icon: <Heart size={13} />, label: '공감', value: idea.vote_count },
        ]}
      />

      <DetailBody>{idea.description}</DetailBody>

      {canChangeStatus && (
        <>
          <SectionDivider label="리더 처리" />
          <StatusPicker<IdeaStatus>
            label="상태 변경"
            current={idea.status}
            options={[...IDEA_STATUSES]}
            toneOf={(s) => IDEA_STATUS_TONE[s]}
            onChange={(s) => { void onStatusChange(s); }}
          />
        </>
      )}
    </div>
  );
}

function CreateIdeaModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; description: string; category: IdeaCategory }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('업무개선');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="아이디어 제안"
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
                await onSubmit({ title: title.trim(), description: description.trim(), category });
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
        <Field label="카테고리">
          <select value={category} onChange={(e) => setCategory(e.target.value as IdeaCategory)}>
            {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="제목">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="어떤 아이디어인가요?" />
        </Field>
        <Field label="설명">
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="배경·제안 내용·기대 효과" />
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
