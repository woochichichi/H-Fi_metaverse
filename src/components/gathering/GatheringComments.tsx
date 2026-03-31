import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { useGatherings } from '../../hooks/useGatherings';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import type { GatheringComment, Profile } from '../../types';

type CommentProfile = Pick<Profile, 'id' | 'name' | 'nickname' | 'avatar_emoji' | 'avatar_color'>;

interface GatheringCommentsProps {
  gatheringId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  return `${days}일 전`;
}

export default function GatheringComments({ gatheringId }: GatheringCommentsProps) {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const { fetchComments, addComment, deleteComment } = useGatherings();

  const [comments, setComments] = useState<GatheringComment[]>([]);
  const [profiles, setProfiles] = useState<Map<string, CommentProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadComments = async () => {
    setLoading(true);
    const result = await fetchComments(gatheringId);
    setComments(result.comments);
    if (result.profiles) {
      const map = new Map<string, CommentProfile>();
      result.profiles.forEach((p) => map.set(p.id, p));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [gatheringId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = async () => {
    if (!user || !input.trim()) return;
    setSubmitting(true);
    const { data, error } = await addComment(gatheringId, user.id, input.trim());
    setSubmitting(false);
    if (error) {
      addToast(`댓글 등록 실패: ${error}`, 'error');
    } else if (data) {
      setInput('');
      await loadComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await deleteComment(commentId);
    if (error) {
      addToast(`삭제 실패: ${error}`, 'error');
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const displayName = (authorId: string | null) => {
    if (!authorId) return '알 수 없음';
    const p = profiles.get(authorId);
    return p ? (p.nickname || p.name) : '알 수 없음';
  };

  const authorEmoji = (authorId: string | null) => {
    if (!authorId) return '👤';
    return profiles.get(authorId)?.avatar_emoji ?? '👤';
  };

  const authorColor = (authorId: string | null) => {
    if (!authorId) return '#666';
    return profiles.get(authorId)?.avatar_color ?? '#666';
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
        <MessageCircle size={13} />
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* 댓글 목록 */}
      <div ref={listRef} className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-2 rounded-lg bg-white/[.03] p-2 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-16 rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/[.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-text-muted py-3 text-center">아직 댓글이 없습니다</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex gap-2 rounded-lg bg-white/[.04] p-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: authorColor(c.author_id) + '33' }}
              >
                {authorEmoji(c.author_id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-primary">{displayName(c.author_id)}</span>
                  <span className="text-[10px] text-text-muted">{timeAgo(c.created_at)}</span>
                  {c.author_id === user?.id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto hidden text-text-muted transition-colors hover:text-error group-hover:block"
                      title="삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-secondary whitespace-pre-wrap break-words leading-relaxed mt-0.5">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 입력 */}
      {user && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="댓글을 입력하세요"
            maxLength={500}
            className="flex-1 rounded-lg bg-white/[.06] px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none transition-colors focus:bg-white/[.1]"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent/80 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
