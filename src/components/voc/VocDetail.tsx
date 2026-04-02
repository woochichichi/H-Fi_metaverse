import { useState, useEffect } from 'react';
import { ArrowLeft, EyeOff, User, Paperclip, Trash2, ShieldOff, Shield, Pencil, X as XIcon } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import ThreadPanel from '../thread/ThreadPanel';
import { useVocs } from '../../hooks/useVocs';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../lib/utils';
import { VOC_STATUSES, VOC_SEVERITY_LABELS } from '../../lib/constants';
import VocComments from './VocComments';
import type { Voc } from '../../types';
import type { VocStatus } from '../../lib/constants';

const SEVERITY_COLORS: Record<number, string> = {
  1: '#22c55e', 2: '#86efac', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444',
};

interface VocDetailProps {
  voc: Voc;
  onBack: () => void;
  onUpdated: (voc: Voc) => void;
  onDeleted?: () => void;
}

export default function VocDetail({ voc, onBack, onUpdated, onDeleted }: VocDetailProps) {
  const { profile } = useAuthStore();
  const { updateVoc, deleteVoc, hideVoc, isAnonymousAuthor, fetchAssignees, incrementViewCount } = useVocs();
  const { addToast } = useUiStore();

  const [status, setStatus] = useState<VocStatus>(voc.status);
  const [resolution, setResolution] = useState(voc.resolution || '');
  const [assigneeId, setAssigneeId] = useState<string | null>(voc.assignee_id);
  const [assignees, setAssignees] = useState<{ id: string; name: string; nickname?: string | null; role: string; team: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [editTitle, setEditTitle] = useState(voc.title);
  const [editContent, setEditContent] = useState(voc.content);
  const [savingContent, setSavingContent] = useState(false);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';

  useEffect(() => {
    incrementViewCount(voc.id);
  }, [voc.id, incrementViewCount]);

  useEffect(() => {
    if (isLeader) {
      fetchAssignees(voc.team).then(setAssignees).catch(() => setAssignees([]));
    }
  }, [isLeader, voc.team, fetchAssignees]);

  const canReplyAsAuthor = voc.anonymous
    ? isAnonymousAuthor(voc.id, voc.session_token)
    : voc.author_id === profile?.id;

  const canDelete = isAdmin || canReplyAsAuthor;
  // 비익명 작성자이고 접수 상태일 때만 내용 수정 허용
  const canEditContent = !voc.anonymous && voc.author_id === profile?.id && voc.status === '접수';

  const handleSaveContent = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      addToast('제목과 내용을 입력해주세요', 'error');
      return;
    }
    setSavingContent(true);
    const { data, error } = await updateVoc(voc.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    setSavingContent(false);
    if (error) {
      addToast(`수정 실패: ${error}`, 'error');
      return;
    }
    addToast('VOC 내용이 수정되었습니다', 'success');
    setEditingContent(false);
    if (data) onUpdated(data);
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);

    const { error } = await deleteVoc(voc.id);
    setDeleting(false);
    setShowDeleteConfirm(false);

    if (error) {
      addToast(`삭제 실패: ${error}`, 'error');
      return;
    }

    addToast('VOC가 삭제되었습니다', 'success');
    onDeleted?.();
  };

  const handleToggleHidden = async () => {
    if (hiding) return;
    const newHidden = !voc.is_hidden;
    setHiding(true);

    const { data, error } = await hideVoc(voc.id, newHidden);
    setHiding(false);

    if (error) {
      addToast(`처리 실패: ${error}`, 'error');
      return;
    }

    addToast(newHidden ? 'VOC가 비공개 처리되었습니다' : 'VOC가 공개 전환되었습니다', 'success');
    if (data) onUpdated(data);
  };

  const needsResolution = status === '완료' || status === '보류';

  const handleSave = async () => {
    if (saving) return;
    if (needsResolution && !resolution.trim()) {
      addToast('처리 결과를 입력해 주세요', 'error');
      return;
    }
    setSaving(true);

    const { data, error } = await updateVoc(voc.id, {
      status,
      resolution: resolution.trim() || null,
      assignee_id: assigneeId,
    });

    setSaving(false);

    if (error) {
      addToast(`수정 실패: ${error}`, 'error');
      return;
    }

    addToast('VOC가 업데이트되었습니다', 'success');
    if (data) onUpdated(data);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-white/[.06] px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="flex-1 font-heading text-base font-bold text-text-primary truncate">
          VOC 상세
        </h2>
        {/* ④ 비공개 처리 토글 (리더 이상) */}
        {isLeader && (
          <button
            onClick={handleToggleHidden}
            disabled={hiding}
            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors disabled:opacity-40 ${
              voc.is_hidden
                ? 'bg-success/15 text-success hover:bg-success/25'
                : 'bg-danger/15 text-danger hover:bg-danger/25'
            }`}
            title={voc.is_hidden ? '공개 전환' : '비공개 처리'}
          >
            {voc.is_hidden ? <Shield size={13} /> : <ShieldOff size={13} />}
            {voc.is_hidden ? '공개' : '비공개'}
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/20 hover:text-danger disabled:opacity-40"
            title="삭제"
          >
            <Trash2 size={15} />
          </button>
        )}
        <StatusBadge status={voc.status} size="md" />
      </div>

      {/* 비공개 배너 */}
      {voc.is_hidden && (
        <div className="bg-danger/10 border-b border-danger/20 px-4 py-2">
          <p className="text-[11px] text-danger font-medium">
            이 VOC는 비공개 처리되었습니다. 관리자만 볼 수 있습니다.
          </p>
        </div>
      )}

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 카테고리 + 메타 */}
        <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent font-medium">
            {voc.category}
          </span>
          {voc.sub_category && (
            <span className="rounded-full bg-white/[.08] px-2 py-0.5 text-text-secondary">
              {voc.sub_category}
            </span>
          )}
          {voc.target_area && (
            <span className="rounded-full bg-info/15 px-2 py-0.5 text-info">
              {voc.target_area}
            </span>
          )}
          {voc.severity && (
            <span
              className="rounded-full px-2 py-0.5 font-bold text-[11px]"
              style={{
                color: SEVERITY_COLORS[voc.severity],
                backgroundColor: `${SEVERITY_COLORS[voc.severity]}20`,
              }}
            >
              심각도 {voc.severity} — {VOC_SEVERITY_LABELS[voc.severity]}
            </span>
          )}
          <span>·</span>
          <span>{voc.team}</span>
          <span>·</span>
          <span>{formatRelativeTime(voc.created_at)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">👁 {voc.view_count ?? 0}</span>
        </div>

        {/* 제목 */}
        {editingContent ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value.slice(0, 200))}
            className="w-full rounded-lg bg-white/[.08] px-3 py-2 text-base font-bold text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        ) : (
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-lg font-bold text-text-primary font-body">{voc.title}</h3>
            {canEditContent && (
              <button
                onClick={() => setEditingContent(true)}
                className="mt-1 flex h-6 w-6 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/20 hover:text-accent shrink-0"
                title="내용 수정"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        )}

        {/* 작성자 */}
        <div className="flex items-center gap-1 text-xs text-text-muted">
          {voc.anonymous ? (
            <>
              <EyeOff size={12} /> 익명
            </>
          ) : (
            <>
              <User size={12} /> 실명
            </>
          )}
        </div>

        {/* 내용 */}
        {editingContent ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.slice(0, 2000))}
              rows={6}
              className="w-full resize-none rounded-xl bg-white/[.08] px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveContent}
                disabled={savingContent}
                className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent/80 disabled:opacity-40"
              >
                {savingContent ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => { setEditingContent(false); setEditTitle(voc.title); setEditContent(voc.content); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-white/10"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white/[.04] p-3">
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {voc.content}
            </p>
          </div>
        )}

        {/* 첨부파일 */}
        {voc.attachment_urls && voc.attachment_urls.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-text-muted flex items-center gap-1">
              <Paperclip size={12} /> 첨부파일 ({voc.attachment_urls.length})
            </p>
            {voc.attachment_urls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate rounded-lg bg-white/[.04] px-3 py-1.5 text-xs text-info hover:bg-white/[.08] transition-colors"
              >
                첨부파일 {i + 1}
              </a>
            ))}
          </div>
        )}

        {/* ⑤ 처리 결과 (피드백 루프 강화) */}
        {voc.resolution && (
          <div className="rounded-xl bg-success/10 border border-success/20 p-3">
            <p className="text-xs font-medium text-success mb-1">처리 결과</p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{voc.resolution}</p>
          </div>
        )}

        {/* 리더/관리자 전용 액션 */}
        {isLeader && (
          <div className="space-y-3 rounded-xl border border-accent/20 bg-accent/[.06] p-3">
            <h4 className="text-xs font-semibold text-accent">관리자 처리</h4>

            {/* 담당자 배정 */}
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">담당자</label>
              <select
                value={assigneeId ?? ''}
                onChange={(e) => setAssigneeId(e.target.value || null)}
                className="w-full rounded-lg bg-white/[.08] px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">미배정</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nickname || a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 변경 */}
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">상태 변경</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VocStatus)}
                className="w-full rounded-lg bg-white/[.08] px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
              >
                {VOC_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 처리 결과 (완료/보류 시) */}
            {needsResolution && (
              <div>
                <label className="text-[11px] text-text-muted mb-1 block">
                  처리 결과 <span className="text-danger">*</span>
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="처리 결과를 입력하세요 — 이 내용은 VOC 목록에 공개됩니다"
                  rows={3}
                  className="w-full resize-none rounded-lg bg-white/[.08] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}

        {/* 공감 댓글 */}
        <VocComments vocId={voc.id} />

        {/* 대화 스레드 */}
        <ThreadPanel
          refType="voc"
          refId={voc.id}
          canReplyAsAuthor={canReplyAsAuthor}
          canReplyAsManager={isLeader}
        />
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="VOC 삭제"
        message="이 VOC를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
