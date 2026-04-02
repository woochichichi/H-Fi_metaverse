import { useState } from 'react';
import { ThumbsUp, MessageCircle, Send, Pencil, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import type { TeamPostWithCounts, PostCommentWithAuthor } from '../../hooks/useTeamPosts';

const CATEGORY_STYLES: Record<string, string> = {
  '자유': 'bg-emerald-500/20 text-emerald-400',
  '질문': 'bg-blue-500/20 text-blue-400',
  '정보': 'bg-amber-500/20 text-amber-400',
  '잡담': 'bg-purple-500/20 text-purple-400',
};

interface TeamPostCardProps {
  post: TeamPostWithCounts;
  readOnly: boolean;
  userId?: string;
  comments: PostCommentWithAuthor[];
  expanded: boolean;
  onToggleLike: (postId: string) => void;
  onExpandComments: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onEdit?: (post: TeamPostWithCounts) => void;
  onDelete?: (postId: string) => void;
}

export default function TeamPostCard({
  post, readOnly, userId, comments, expanded,
  onToggleLike, onExpandComments, onAddComment, onEdit, onDelete,
}: TeamPostCardProps) {
  const [commentText, setCommentText] = useState('');

  const isOwner = !readOnly && userId && post.author_id === userId;

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(post.id, trimmed);
    setCommentText('');
  };

  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.03] p-3 transition-colors hover:bg-white/[.05]">
      {/* 상단: 카테고리 + 작성자 */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_STYLES[post.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
          {post.category}
        </span>
        <span className="text-[11px] font-semibold text-text-primary">{post.author_name}</span>
        <span className="ml-auto text-[10px] text-text-muted">{formatRelativeTime(post.created_at)}</span>
        {isOwner && (
          <>
            {onEdit && (
              <button
                onClick={() => onEdit(post)}
                className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:bg-accent/20 hover:text-accent"
                title="수정"
              >
                <Pencil size={10} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:bg-danger/20 hover:text-danger"
                title="삭제"
              >
                <Trash2 size={10} />
              </button>
            )}
          </>
        )}
      </div>

      {/* 내용 */}
      <p className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-line mb-2.5">
        {post.content}
      </p>

      {/* 하단: 좋아요 + 댓글 */}
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <button
          onClick={() => !readOnly && userId && onToggleLike(post.id)}
          disabled={readOnly || !userId}
          className={`flex items-center gap-1 transition-colors ${
            readOnly ? 'cursor-default opacity-50'
              : post.my_like ? 'text-accent' : 'hover:text-accent'
          }`}
        >
          <ThumbsUp size={12} fill={post.my_like ? 'currentColor' : 'none'} />
          {post.like_count > 0 && post.like_count}
        </button>
        <button onClick={() => onExpandComments(post.id)}
          className="flex items-center gap-1 transition-colors hover:text-text-secondary">
          <MessageCircle size={12} />
          {post.comment_count > 0 && post.comment_count}
        </button>
      </div>

      {/* 댓글 펼침 */}
      {expanded && (
        <div className="mt-2 border-t border-white/[.06] pt-2">
          {comments.length === 0 ? (
            <p className="text-[10px] text-text-muted py-1">댓글이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-1.5 mb-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-xs">
                  <span className="font-medium text-text-primary shrink-0">{c.author_name ?? '알 수 없음'}</span>
                  <span className="text-text-secondary flex-1">{c.content}</span>
                  <span className="text-[10px] text-text-muted shrink-0">{formatRelativeTime(c.created_at)}</span>
                </div>
              ))}
            </div>
          )}
          {!readOnly && userId && (
            <div className="flex gap-1.5">
              <input type="text" value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="댓글 입력..."
                maxLength={200}
                className="flex-1 rounded-lg border border-white/[.08] bg-white/[.04] px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50" />
              <button onClick={handleSubmitComment} disabled={!commentText.trim()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent transition-colors hover:bg-accent/30 disabled:opacity-30">
                <Send size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
