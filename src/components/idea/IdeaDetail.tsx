import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Trash2, Pencil } from 'lucide-react';
import { useIdeas } from '../../hooks/useIdeas';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { IDEA_STATUSES } from '../../lib/constants';
import { formatRelativeTime } from '../../lib/utils';
import ConfirmDialog from '../common/ConfirmDialog';
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

interface IdeaDetailProps {
  idea: IdeaWithVotes & { _voted?: boolean; _commentCount?: number };
  onBack: () => void;
  onDeleted: () => void;
  onEdit: (idea: IdeaWithVotes) => void;
  onVote: (ideaId: string) => void;
  onStatusChange?: (ideaId: string, status: IdeaStatus) => void;
}

export default function IdeaDetail({ idea, onBack, onDeleted, onEdit, onVote, onStatusChange }: IdeaDetailProps) {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const { deleteIdea, incrementViewCount } = useIdeas();

  const [animating, setAnimating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { incrementViewCount(idea.id); }, [idea.id, incrementViewCount]);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';
  const isAuthor = idea.author_id === profile?.id;
  const canDelete = isAdmin || isAuthor;

  const catConfig = CATEGORY_CONFIG[idea.category ?? '기타'];
  const statusConfig = STATUS_CONFIG[idea.status];

  const handleVote = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onVote(idea.id);
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
    onDeleted();
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
        <h2 className="flex-1 font-heading text-sm font-bold text-text-primary line-clamp-1">{idea.title}</h2>
        {isAuthor && (
          <button
            onClick={() => onEdit(idea)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/20 hover:text-accent"
            title="수정"
          >
            <Pencil size={14} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-500/20 hover:text-red-400"
            title="삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 본문 */}
        <div className="border-b border-white/[.06] p-4">
          {/* 메타: 카테고리 + 상태 + 날짜 + 조회수 */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ color: catConfig.color, backgroundColor: catConfig.bg }}
            >
              {idea.category ?? '기타'}
            </span>
            {isLeader && onStatusChange ? (
              <select
                value={idea.status}
                onChange={(e) => onStatusChange(idea.id, e.target.value as IdeaStatus)}
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
            <span className="text-[10px] text-text-muted">👁 {idea.view_count ?? 0}</span>
            <span className="ml-auto text-[10px] text-text-muted">{formatRelativeTime(idea.created_at)}</span>
          </div>

          {/* 본문 */}
          <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{idea.description}</p>

          {/* 투표 버튼 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleVote}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                idea._voted
                  ? 'bg-danger/20 text-danger ring-1 ring-danger/30'
                  : 'bg-white/[.06] text-text-muted hover:bg-danger/10 hover:text-danger'
              }`}
              style={animating ? { animation: 'heartBounce .3s ease' } : undefined}
            >
              <Heart size={16} fill={idea._voted ? 'currentColor' : 'none'} />
              <span>{idea._voted ? '좋아요 취소' : '좋아요'}</span>
              <span className="font-mono text-xs opacity-70">{idea.vote_count}</span>
            </button>
          </div>
        </div>

        {/* 댓글 */}
        <div className="p-4">
          <IdeaComments ideaId={idea.id} />
        </div>
      </div>

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
