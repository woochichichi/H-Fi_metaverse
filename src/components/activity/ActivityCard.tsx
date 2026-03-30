import { useState } from 'react';
import { ThumbsUp, MessageCircle, ChevronDown, Send } from 'lucide-react';
import type { UnitActivityWithCounts, CommentWithAuthor } from '../../hooks/useUnitActivities';

const STATUS_COLORS: Record<string, string> = {
  '계획': 'bg-blue-500/20 text-blue-400',
  '진행중': 'bg-amber-500/20 text-amber-400',
  '완료': 'bg-emerald-500/20 text-emerald-400',
  '보류': 'bg-gray-500/20 text-gray-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  '이벤트': '🎉',
  '인적교류': '🤝',
  'VoC': '📞',
  '소프트랜딩': '🛬',
  '기타': '📋',
};

const STATUS_OPTIONS = ['계획', '진행중', '완료', '보류'] as const;

interface ActivityCardProps {
  activity: UnitActivityWithCounts;
  isLeader: boolean;
  readOnly: boolean;
  userId?: string;
  comments: CommentWithAuthor[];
  onToggleReaction: (activityId: string) => void;
  onStatusChange: (activityId: string, status: string) => void;
  onExpandComments: (activityId: string) => void;
  onAddComment: (activityId: string, content: string) => void;
  expanded: boolean;
}

export default function ActivityCard({
  activity,
  isLeader,
  readOnly,
  userId,
  comments,
  onToggleReaction,
  onStatusChange,
  onExpandComments,
  onAddComment,
  expanded,
}: ActivityCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(activity.id, trimmed);
    setCommentText('');
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.03] p-3 transition-colors hover:bg-white/[.05]">
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {activity.category && (
            <span className="text-sm">{CATEGORY_LABELS[activity.category] ?? '📋'}</span>
          )}
          <h4 className="text-sm font-semibold text-text-primary line-clamp-1">
            {activity.title}
          </h4>
        </div>

        {/* 상태 뱃지 (리더: 클릭 시 변경 드롭다운) */}
        <div className="relative">
          <button
            onClick={() => isLeader && !readOnly && setShowStatusMenu(!showStatusMenu)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[activity.status] ?? 'bg-gray-500/20 text-gray-400'} ${isLeader && !readOnly ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            {activity.status}
            {isLeader && !readOnly && <ChevronDown size={10} className="ml-0.5 inline" />}
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border border-white/[.1] bg-bg-secondary p-1 shadow-lg">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(activity.id, s);
                    setShowStatusMenu(false);
                  }}
                  className={`block w-full rounded px-3 py-1 text-left text-[11px] transition-colors ${
                    activity.status === s
                      ? 'bg-accent/20 text-accent'
                      : 'text-text-secondary hover:bg-white/[.06]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 설명 */}
      {activity.description && (
        <p className="text-xs text-text-secondary leading-relaxed mb-2 whitespace-pre-line line-clamp-3">
          {activity.description}
        </p>
      )}

      {/* 하단: 좋아요 + 댓글 + 시간 */}
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <button
          onClick={() => !readOnly && userId && onToggleReaction(activity.id)}
          disabled={readOnly || !userId}
          className={`flex items-center gap-1 transition-colors ${
            readOnly
              ? 'cursor-default opacity-50'
              : activity.my_reaction
                ? 'text-accent'
                : 'hover:text-accent'
          }`}
        >
          <ThumbsUp size={12} fill={activity.my_reaction ? 'currentColor' : 'none'} />
          {activity.reaction_count > 0 && activity.reaction_count}
        </button>

        <button
          onClick={() => onExpandComments(activity.id)}
          className="flex items-center gap-1 transition-colors hover:text-text-secondary"
        >
          <MessageCircle size={12} />
          {activity.comment_count > 0 && activity.comment_count}
        </button>

        <span className="ml-auto">{timeAgo(activity.created_at)}</span>
      </div>

      {/* 댓글 펼침 영역 */}
      {expanded && (
        <div className="mt-2 border-t border-white/[.06] pt-2">
          {comments.length === 0 ? (
            <p className="text-[10px] text-text-muted py-1">댓글이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-1.5 mb-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-xs">
                  <span className="font-medium text-text-primary shrink-0">
                    {c.author_name ?? '알 수 없음'}
                  </span>
                  <span className="text-text-secondary flex-1">{c.content}</span>
                  <span className="text-[10px] text-text-muted shrink-0">
                    {timeAgo(c.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 입력 (읽기 전용이 아닐 때만) */}
          {!readOnly && userId && (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="댓글 입력..."
                maxLength={200}
                className="flex-1 rounded-lg border border-white/[.08] bg-white/[.04] px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent transition-colors hover:bg-accent/30 disabled:opacity-30"
              >
                <Send size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
