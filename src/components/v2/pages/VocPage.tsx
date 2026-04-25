import { useEffect, useState } from 'react';
import { MessageSquareHeart, Plus, AlertTriangle, ShieldCheck, Users, X } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
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
import { VOC_CATEGORIES, VOC_STATUSES } from '../../../lib/constants';
import type { VocCategory, VocStatus } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import { useV2Toast } from '../ui/Toast';
import { confirm } from '../ui/dialog';
import type { Voc } from '../../../types';

export default function VocPage() {
  const { user, profile } = useAuthStore();
  const perm = usePermissions();
  const { vocs, loading, fetchVocs, createVoc, updateVoc, deleteVoc } = useVocs();
  const showToast = useV2Toast((s) => s.show);

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
            label: '바라는점',
            badge: profile?.team ? { text: profile.team, tone: 'accent' } : undefined,
          },
        ]}
        title="바라는점"
        description="팀원·팀장·회사에 바라는 점을 남겨주세요. 불편·요청·칭찬·개선 의견 모두 환영합니다."
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>바라는점 올리기</span>
          </button>
        }
      />

      <AnonymityNotice />

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
      ) : (
        <MasterDetail
          hasSelection={showCreate || !!detail}
          onBackMobile={() => {
            setShowCreate(false);
            setDetail(null);
          }}
          emptyTitle={vocs.length === 0 ? '아직 등록된 바라는점이 없어요' : '바라는점을 선택하세요'}
          emptyDescription={
            vocs.length === 0
              ? '"바라는점 올리기" 로 첫 글을 남겨보세요 🙋'
              : '왼쪽 목록에서 하나를 선택하면 내용과 처리 영역이 여기에 표시됩니다.'
          }
          master={
            <MasterListCard>
              {vocs.map((v) => {
                const selected = !showCreate && detail?.id === v.id;
                return (
                  <MasterListItem
                    key={v.id}
                    selected={selected}
                    onClick={() => {
                      setShowCreate(false);
                      setDetail(v);
                    }}
                  >
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
            showCreate && profile && user ? (
              <CreateVocPanel
                defaultTeam={profile.team}
                onClose={() => setShowCreate(false)}
                onSubmit={async (input) => {
                  const { error } = await createVoc({
                    ...input,
                    author_id: input.anonymous ? null : user.id,
                  });
                  if (error) {
                    showToast(`등록 실패: ${error}`, 'error');
                    return;
                  }
                  setShowCreate(false);
                  await fetchVocs({ status, category, team: teamFilter });
                  showToast('바라는점이 등록되었습니다', 'success');
                }}
              />
            ) : detail && user ? (
              <VocDetailPanel
                key={detail.id}
                voc={detail}
                onClose={() => setDetail(null)}
                canProcess={perm.canProcessVoc}
                canDelete={perm.isAdmin || detail.author_id === user.id}
                onStatusChange={async (s) => {
                  const { error } = await updateVoc(detail.id, { status: s });
                  if (error) showToast(`변경 실패: ${error}`, 'error');
                  else setDetail({ ...detail, status: s });
                }}
                onResolution={async (r) => {
                  const { error } = await updateVoc(detail.id, { resolution: r });
                  if (error) showToast(`저장 실패: ${error}`, 'error');
                  else setDetail({ ...detail, resolution: r });
                }}
                onDelete={async () => {
                  const ok = await confirm({ title: '바라는점 삭제', message: '정말 삭제하시겠어요?' });
                  if (!ok) return;
                  const { error } = await deleteVoc(detail.id);
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
        label="바라는점 내용"
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

/**
 * 사이드 패널 작성 폼 — Master-Detail 의 detail 자리에 렌더.
 * 입력은 카테고리(고르게)+제목+내용+익명만. 세부항목·심각도는 default 로 등록 후
 * 리더가 처리 단계에서 분류·우선순위를 매김.
 */
function CreateVocPanel({
  onClose,
  onSubmit,
  defaultTeam,
}: {
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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'var(--w-surface)',
        border: '1px solid var(--w-border)',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--w-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} style={{ color: 'var(--w-accent)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-text)' }}>바라는점 올리기</span>
        </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 18px' }}>
        <Field label="카테고리">
          <select value={category} onChange={(e) => setCategory(e.target.value as VocCategory)}>
            {VOC_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="예) 회의실 예약이 너무 복잡해요 / 커피머신 자주 고장나요"
          />
        </Field>
        <Field label="내용">
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="자세한 상황과 의견을 적어주세요"
          />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--w-text-soft)' }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            style={{ width: 'auto', padding: 0 }}
          />
          익명으로 제출 — 작성자 식별 정보가 DB에 저장되지 않아요 (리더·팀장·관리자 누구도 작성자 조회 불가)
        </label>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 18px',
          borderTop: '1px solid var(--w-border)',
          background: 'var(--w-surface-2)',
          borderRadius: '0 0 12px 12px',
        }}
      >
        <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>
          취소
        </button>
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
                severity: null,
                sub_category: null,
              });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </div>
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

function AnonymityNotice() {
  return (
    <div
      className="w-card"
      style={{
        padding: 14,
        marginBottom: 14,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
        background: 'var(--w-surface)',
        border: '1px solid var(--w-border)',
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <Users size={18} style={{ color: 'var(--w-accent)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>
            유닛 리더 + 팀장이 함께 봅니다
          </div>
          <div style={{ fontSize: 12, color: 'var(--w-text-soft)', lineHeight: 1.5 }}>
            접수된 내용은 해당 유닛 리더와 팀장이 함께 검토해 처리 방향을 정합니다.
            처리 진행 단계(접수 → 검토중 → 처리중 → 완료)는 우측 상세에서 확인할 수 있어요.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <ShieldCheck size={18} style={{ color: 'var(--w-success)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>
            익명 제출은 정말 익명입니다
          </div>
          <div style={{ fontSize: 12, color: 'var(--w-text-soft)', lineHeight: 1.5 }}>
            익명 체크 시 작성자 ID가 DB에 <b>NULL</b>로 저장되며, 활동 로그에도 기록되지 않습니다.
            관리자·리더·팀장 누구도 누가 썼는지 알 수 없고, 추후에도 조회·복원할 방법이 없습니다.
          </div>
        </div>
      </div>
    </div>
  );
}
