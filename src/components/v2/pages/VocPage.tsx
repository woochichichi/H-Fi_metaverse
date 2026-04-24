import { useEffect, useState } from 'react';
import { MessageSquareHeart, Plus, AlertTriangle } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import { StatusPicker, type StatusTone } from '../ui/DetailShell';
import {
  PostHeaderCard,
  WorkflowStepper,
  DescriptionCard,
  ReplyCard,
  ComposerCard,
} from '../ui/PostDetail';
import MasterDetail, { MasterListCard, MasterListItem } from '../ui/MasterDetail';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useVocs } from '../../../hooks/useVocs';
import {
  VOC_CATEGORIES,
  VOC_STATUSES,
  VOC_SUB_CATEGORIES,
  VOC_SEVERITY_LEVELS,
  VOC_SEVERITY_LABELS,
} from '../../../lib/constants';
import type { VocCategory, VocStatus } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import type { Voc } from '../../../types';

export default function VocPage() {
  const { user, profile } = useAuthStore();
  const perm = usePermissions();
  const { vocs, loading, fetchVocs, createVoc, updateVoc, deleteVoc } = useVocs();

  const [status, setStatus] = useState<VocStatus | null>(null);
  const [category, setCategory] = useState<VocCategory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Voc | null>(null);

  // 리더는 자기 팀만 표시 (admin은 전체)
  const teamFilter = perm.isAdmin ? null : profile?.team ?? null;

  useEffect(() => {
    void fetchVocs({ status, category, team: teamFilter });
  }, [status, category, teamFilter, fetchVocs]);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          {
            label: 'VOC',
            badge: profile?.team ? { text: profile.team, tone: 'accent' } : undefined,
          },
        ]}
        title="VOC"
        description="팀원·팀장·회사에 바라는 점을 익명으로 남겨주세요. 불편·요청·칭찬·개선 의견 모두 환영합니다."
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>VOC 올리기</span>
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <FilterBar
          label="상태"
          value={status}
          onChange={setStatus}
          options={[{ value: null, label: '전체' }, ...VOC_STATUSES.map((s) => ({ value: s as VocStatus, label: s }))]}
        />
        <FilterBar
          label="카테고리"
          value={category}
          onChange={setCategory}
          options={[
            { value: null, label: '전체' },
            ...VOC_CATEGORIES.map((c) => ({ value: c as VocCategory, label: c })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingCard />
      ) : vocs.length === 0 ? (
        <div className="w-card">
          <EmptyState
            icon={MessageSquareHeart}
            title="아직 VOC가 없어요"
            description="첫 번째 목소리가 되어보세요 🙋"
          />
        </div>
      ) : (
        <MasterDetail
          hasSelection={!!detail}
          onBackMobile={() => setDetail(null)}
          emptyTitle="VOC를 선택하세요"
          emptyDescription="왼쪽 목록에서 하나를 선택하면 내용과 처리 영역이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {vocs.map((v) => {
                const selected = detail?.id === v.id;
                return (
                  <MasterListItem key={v.id} selected={selected} onClick={() => setDetail(v)}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusBadge status={v.status} />
                      <span className="w-badge w-badge-muted">{v.category}</span>
                      {v.anonymous && <span className="w-badge w-badge-accent">익명</span>}
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
                      {v.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                      {v.team} · {formatRelativeTime(v.created_at)}
                    </div>
                  </MasterListItem>
                );
              })}
            </MasterListCard>
          }
          detail={
            detail && user && (
              <VocDetailPanel
                key={detail.id}
                voc={detail}
                onClose={() => setDetail(null)}
                canProcess={perm.canProcessVoc}
                canDelete={perm.isAdmin || detail.author_id === user.id}
                onStatusChange={async (s) => {
                  const { error } = await updateVoc(detail.id, { status: s });
                  if (error) alert(`변경 실패: ${error}`);
                  else setDetail({ ...detail, status: s });
                }}
                onResolution={async (r) => {
                  const { error } = await updateVoc(detail.id, { resolution: r });
                  if (error) alert(`저장 실패: ${error}`);
                  else setDetail({ ...detail, resolution: r });
                }}
                onDelete={async () => {
                  if (!confirm('정말 삭제하시겠어요?')) return;
                  const { error } = await deleteVoc(detail.id);
                  if (error) alert(`삭제 실패: ${error}`);
                  else setDetail(null);
                }}
              />
            )
          }
        />
      )}

      {showCreate && profile && user && (
        <CreateVocModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          defaultTeam={profile.team}
          onSubmit={async (input) => {
            const { error } = await createVoc({
              ...input,
              author_id: input.anonymous ? null : user.id,
            });
            if (!error) {
              setShowCreate(false);
              await fetchVocs({ status, category, team: teamFilter });
            } else alert(`등록 실패: ${error}`);
          }}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: VocStatus }) {
  if (status === '완료') return <span className="w-badge" style={{ background: 'var(--w-success-soft)', color: 'var(--w-success)' }}>완료</span>;
  if (status === '보류') return <span className="w-badge w-badge-muted">보류</span>;
  if (status === '처리중') return <span className="w-badge w-badge-accent">처리중</span>;
  if (status === '검토중') return <span className="w-badge w-badge-todo">검토중</span>;
  return <span className="w-badge w-badge-info">접수</span>;
}

function LoadingCard() {
  return (
    <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
      불러오는 중...
    </div>
  );
}

const VOC_STATUS_TONE: Record<VocStatus, StatusTone> = {
  '접수': 'neutral',
  '검토중': 'todo',
  '처리중': 'accent',
  '완료': 'success',
  '보류': 'danger',
};

function VocDetailPanel({
  voc,
  canProcess,
  canDelete,
  onStatusChange,
  onResolution,
  onDelete,
}: {
  voc: Voc;
  onClose: () => void; // 시그니처 호환용 (미사용)
  canProcess: boolean;
  canDelete: boolean;
  onStatusChange: (s: VocStatus) => Promise<void>;
  onResolution: (r: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  // 선택 VOC가 바뀌면 부모에서 key={voc.id}로 컴포넌트가 재마운트 →
  // useState 초기값이 새 voc의 resolution으로 자동 동기화.
  const [resolution, setResolution] = useState(voc.resolution ?? '');

  // 보류 상태는 별도 분기로 표시 (4단계 stepper 대신 경고)
  const isOnHold = voc.status === '보류';
  const flowSteps: { key: VocStatus; label: string }[] = [
    { key: '접수', label: '접수' },
    { key: '검토중', label: '검토중' },
    { key: '처리중', label: '처리중' },
    { key: '완료', label: '완료' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PostHeaderCard
        icon={<MessageSquareHeart size={22} />}
        iconTone={voc.status === '완료' ? 'success' : voc.status === '보류' ? 'crit' : 'accent'}
        badgeId={`VOC-${voc.id.slice(0, 6)}`}
        badges={
          <>
            <StatusBadge status={voc.status} />
            <span className="w-badge w-badge-muted">{voc.category}</span>
            {voc.sub_category && <span className="w-badge w-badge-muted">{voc.sub_category}</span>}
            {voc.anonymous && <span className="w-badge w-badge-accent">익명</span>}
            {voc.severity && (
              <span
                className="w-badge w-badge-todo"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <AlertTriangle size={10} /> 심각도 {voc.severity}
              </span>
            )}
          </>
        }
        title={voc.title}
        metaLine={
          <>
            <span>{voc.anonymous ? '익명 작성자' : '작성자'}</span>
            <span>·</span>
            <span>{voc.team}</span>
            <span>·</span>
            <span>{formatRelativeTime(voc.created_at)}</span>
            <span>·</span>
            <span>조회 {voc.view_count}</span>
          </>
        }
        canDelete={canDelete}
        onDelete={onDelete}
      />

      {!isOnHold && (
        <WorkflowStepper<VocStatus>
          title="처리 진행"
          steps={flowSteps}
          currentKey={voc.status === '보류' ? '접수' : voc.status}
          quickActions={
            canProcess && (
              <>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-text-muted)' }}>
                  빠른 진행 →
                </span>
                {VOC_STATUSES.filter((s) => s !== voc.status).map((s) => (
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

      <DescriptionCard
        label="VOC 내용"
        timestamp={formatRelativeTime(voc.created_at)}
        attachments={voc.attachment_urls}
      >
        {voc.content}
      </DescriptionCard>

      {voc.resolution && (
        <ReplyCard
          variant="leader"
          avatarLabel="리"
          authorName="리더 회신"
          authorBadge={<span className="w-badge w-badge-accent">{voc.team} 리더</span>}
          timestamp="처리됨"
          tag="LEADER REPLY"
        >
          {voc.resolution}
        </ReplyCard>
      )}

      {canProcess && (
        <ComposerCard
          label="리더 처리"
          topActions={
            <div style={{ marginLeft: 'auto' }}>
              <StatusPicker<VocStatus>
                current={voc.status}
                options={[...VOC_STATUSES]}
                toneOf={(s) => VOC_STATUS_TONE[s]}
                onChange={(s) => {
                  void onStatusChange(s);
                }}
              />
            </div>
          }
          textarea={{
            value: resolution,
            onChange: setResolution,
            placeholder: '처리 결과 / 회신 메시지를 작성해주세요',
            rows: 3,
          }}
          submitLabel="회신 저장"
          submitDisabled={resolution === (voc.resolution ?? '')}
          onSubmit={() => {
            void onResolution(resolution);
          }}
        />
      )}
    </div>
  );
}

function CreateVocModal({
  open,
  onClose,
  onSubmit,
  defaultTeam,
}: {
  open: boolean;
  onClose: () => void;
  defaultTeam: string;
  onSubmit: (input: {
    anonymous: boolean;
    category: VocCategory;
    title: string;
    content: string;
    team: string;
    severity: number | null;
    sub_category: string | null;
  }) => Promise<void>;
}) {
  const [category, setCategory] = useState<VocCategory>('개선');
  const [subCategory, setSubCategory] = useState<string>(VOC_SUB_CATEGORIES['개선'][0]);
  const [severity, setSeverity] = useState<number>(3);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subOptions = VOC_SUB_CATEGORIES[category] ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="VOC 올리기"
      width={560}
      footer={
        <>
          <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button
            className="w-btn w-btn-primary"
            disabled={!title.trim() || !content.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit({
                  anonymous,
                  category,
                  title: title.trim(),
                  content: content.trim(),
                  team: defaultTeam,
                  severity,
                  sub_category: subCategory,
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
            <select
              value={category}
              onChange={(e) => {
                const c = e.target.value as VocCategory;
                setCategory(c);
                setSubCategory(VOC_SUB_CATEGORIES[c]?.[0] ?? '');
              }}
            >
              {VOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="세부항목">
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
              {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="심각도">
            <select value={severity} onChange={(e) => setSeverity(Number(e.target.value))}>
              {VOC_SEVERITY_LEVELS.map((s) => (
                <option key={s} value={s}>{s} · {VOC_SEVERITY_LABELS[s]}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="제목">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="예) 회의실 예약이 너무 복잡해요 / 커피머신 자주 고장나요" />
        </Field>
        <Field label="내용">
          <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="자세한 상황과 의견을 적어주세요" />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--w-text-soft)' }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            style={{ width: 'auto', padding: 0 }}
          />
          익명으로 제출 (리더가 작성자를 알 수 없어요)
        </label>
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
