import { useState } from 'react';
import { Heart, User, Clock, MessageCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useIdeas } from '../../hooks/useIdeas';
import ConfirmDialog from '../common/ConfirmDialog';
import { IDEA_STATUSES } from '../../lib/constants';
import { formatRelativeTime } from '../../lib/utils';
import IdeaComments from './IdeaComments';
import type { IdeaWithVotes } from '../../types';
import type { IdeaStatus } from '../../lib/constants';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  '이벤트': { color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  '인적교류': { color: '#6C5CE7', bg: 'rgba(108,92,231,.15)' },
  '업무개선': { color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
  '기타': { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
};

const STATUS_CONFIG: Record<IdeaStatus, { color: string; bg: string }> = {
  '제안': { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
  '검토': { color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
  '채택': { color: '#6C5CE7', bg: 'rgba(108,92,231,.15)' },
  '진행중': { color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  '완료': { color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
  '반려': { color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
};

interface IdeaCardProps {
  idea: IdeaWithVotes & { _voted?: boolean; _commentCount?: number };
  onVote: (ideaId: string) => void;
  onStatusChange?: (ideaId: string, status: IdeaStatus) => void;
  onDeleted?: () => void;
}

export default function IdeaCard({ idea, onVote, onStatusChange, onDeleted }: IdeaCardProps) {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const { deleteIdea } = useIdeas();
  const [animating, setAnimating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';
  const isAuthor = idea.author_id === profile?.id;
  const canDelete = isAdmin || isAuthor;
  const catConfig = CATEGORY_CONFIG[idea.category ?? '기타'];
  const statusConfig = STATUS_CONFIG[idea.status];

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onVote(idea.id);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as IdeaStatus;
    onStatusChange?.(idea.id, newStatus);
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const { error } = await deleteIdea(idea.id);
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (error) {
      addToast(`삭제 실패: ${error}`, 'error');
      return;
    }
    addToast('아이디어가 삭제되었습니다', 'success');
    onDeleted?.();
  };

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-white/[.06] bg-white/[.03] p-3 transition-colors duration-200 hover:bg-white/[.06] cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ color: catConfig.color, backgroundColor: catConfig.bg }}
        >
          {idea.category ?? '기타'}
        </span>
        {isLeader && onStatusChange ? (
          <select
            value={idea.status}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium outline-none cursor-pointer"
            style={{ color: statusConfig.color, backgroundColor: statusConfig.bg }}
          >
            {IDEA_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ color: statusConfig.color, backgroundColor: statusConfig.bg }}
          >
            {idea.status}
          </span>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{idea.title}</h3>

      {/* 설명 */}
      <p className={`text-xs text-text-muted leading-relaxed ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>{idea.description}</p>

      {/* 하단: 투표 + 댓글 + 메타 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <User size={11} />
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {formatRelativeTime(idea.created_at)}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <MessageCircle size={11} /> {idea._commentCount ?? 0}
          </span>
        </div>

        <button
          onClick={handleVote}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
            idea._voted
              ? 'bg-danger/20 text-danger'
              : 'bg-white/[.06] text-text-muted hover:bg-danger/10 hover:text-danger'
          }`}
          style={animating ? { animation: 'heartBounce .3s ease' } : undefined}
        >
          <Heart size={13} fill={idea._voted ? 'currentColor' : 'none'} />
          <span className="font-mono">{idea.vote_count}</span>
        </button>
      </div>

      {/* 삭제 (펼침 시 + 본인/관리자) */}
      {expanded && canDelete && (
        <div className="flex justify-end pt-1 border-t border-white/[.06]">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            disabled={deleting}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-text-muted transition-colors hover:bg-danger/20 hover:text-danger disabled:opacity-40"
          >
            <Trash2 size={12} />
            삭제
          </button>
        </div>
      )}

      {/* 댓글 (펼침 시) */}
      {expanded && <IdeaComments ideaId={idea.id} />}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="아이디어 삭제"
        message="이 아이디어를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
