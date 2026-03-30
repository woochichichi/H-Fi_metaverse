import { useState, useEffect } from 'react';
import { ArrowLeft, EyeOff, User, Paperclip, Trash2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ThreadPanel from '../thread/ThreadPanel';
import { useVocs } from '../../hooks/useVocs';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../lib/utils';
import { VOC_STATUSES } from '../../lib/constants';
import type { Voc } from '../../types';
import type { VocStatus } from '../../lib/constants';

interface VocDetailProps {
  voc: Voc;
  onBack: () => void;
  onUpdated: (voc: Voc) => void;
  onDeleted?: () => void;
}

export default function VocDetail({ voc, onBack, onUpdated, onDeleted }: VocDetailProps) {
  const { profile } = useAuthStore();
  const { updateVoc, deleteVoc, isAnonymousAuthor, fetchAssignees } = useVocs();
  const { addToast } = useUiStore();

  const [status, setStatus] = useState<VocStatus>(voc.status);
  const [resolution, setResolution] = useState(voc.resolution || '');
  const [assigneeId, setAssigneeId] = useState<string | null>(voc.assignee_id);
  const [assignees, setAssignees] = useState<{ id: string; name: string; nickname?: string | null; role: string; team: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';

  useEffect(() => {
    if (isLeader) {
      fetchAssignees(voc.team).then(setAssignees).catch(() => setAssignees([]));
    }
  }, [isLeader, voc.team, fetchAssignees]);
  const canReplyAsAuthor = voc.anonymous
    ? isAnonymousAuthor(voc.id, voc.session_token)
    : voc.author_id === profile?.id;

  // 삭제 권한: 본인(실명 작성자 또는 익명 세션 토큰 일치) + 관리자
  const canDelete = isAdmin || canReplyAsAuthor;

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirm('이 VOC를 삭제하시겠습니까?')) return;
    setDeleting(true);

    const { error } = await deleteVoc(voc.id);
    setDeleting(false);

    if (error) {
      addToast(`삭제 실패: ${error}`, 'error');
      return;
    }

    addToast('VOC가 삭제되었습니다', 'success');
    onDeleted?.();
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
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/20 hover:text-danger disabled:opacity-40"
            title="삭제"
          >
            <Trash2 size={15} />
          </button>
        )}
        <StatusBadge status={voc.status} size="md" />
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 카테고리 + 메타 */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent font-medium">
            {voc.category}
          </span>
          {voc.target_area && (
            <span className="rounded-full bg-info/15 px-2 py-0.5 text-info">
              {voc.target_area}
            </span>
          )}
          <span>·</span>
          <span>{voc.team}</span>
          <span>·</span>
          <span>{formatRelativeTime(voc.created_at)}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold text-text-primary">{voc.title}</h3>

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
        <div className="rounded-xl bg-white/[.04] p-3">
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {voc.content}
          </p>
        </div>

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

        {/* 처리 결과 (있으면 표시) */}
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
                  placeholder="처리 결과를 입력하세요"
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

        {/* 대화 스레드 */}
        <ThreadPanel
          refType="voc"
          refId={voc.id}
          canReplyAsAuthor={canReplyAsAuthor}
          canReplyAsManager={isLeader}
        />
      </div>
    </div>
  );
}
