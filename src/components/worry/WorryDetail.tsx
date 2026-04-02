import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Trash2, Pencil } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import {
  useWorries,
  WORRY_REACTIONS,
  WORRY_REACTION_LABELS,
  type Worry,
  type WorryCommentWithProfile,
  type WorryReactionType,
} from '../../hooks/useWorries';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';

interface WorryDetailProps {
  worry: Worry;
  onBack: () => void;
  onDeleted: () => void;
  onEdit: (worry: Worry) => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function WorryDetail({ worry, onBack, onDeleted, onEdit }: WorryDetailProps) {
  const { user, profile } = useAuthStore();
  const { addToast } = useUiStore();
  const { fetchComments, addComment, deleteComment, fetchReactions, toggleReaction, deleteWorry, incrementViewCount } =
    useWorries();

  const [comments, setComments] = useState<WorryCommentWithProfile[]>([]);
  const [reactions, setReactions] = useState<Record<WorryReactionType, { count: number; mine: boolean }>>(
    Object.fromEntries(WORRY_REACTIONS.map((r) => [r, { count: 0, mine: false }])) as Record<
      WorryReactionType,
      { count: number; mine: boolean }
    >,
  );
  const [commentText, setCommentText] = useState('');
  const [commentAnon, setCommentAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoadingComments(true);
    const [{ comments: c }, reactMap] = await Promise.all([
      fetchComments(worry.id),
      fetchReactions([worry.id], user?.id),
    ]);
    setComments(c);
    setReactions(reactMap.get(worry.id) ?? reactions);
    setLoadingComments(false);
  }, [worry.id, user?.id, fetchComments, fetchReactions]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { incrementViewCount(worry.id); }, [worry.id, incrementViewCount]);

  const handleReaction = async (reaction: WorryReactionType) => {
    if (!user) { addToast('로그인이 필요합니다', 'error'); return; }
    // 낙관적 업데이트
    setReactions((prev) => {
      const cur = prev[reaction];
      return {
        ...prev,
        [reaction]: { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine },
      };
    });
    try {
      await toggleReaction(worry.id, user.id, reaction);
    } catch {
      addToast('반응 처리에 실패했습니다', 'error');
      load(); // 롤백
    }
  };

  const handleComment = async () => {
    if (!user) { addToast('로그인이 필요합니다', 'error'); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    const { error } = await addComment({
      worry_id: worry.id,
      content: commentText.trim(),
      anonymous: commentAnon,
      author_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      addToast(`댓글 등록 실패: ${error}`, 'error');
    } else {
      setCommentText('');
      load();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await deleteComment(commentId, worry.id);
    if (error) addToast(`삭제 실패: ${error}`, 'error');
    else setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleDeleteWorry = async () => {
    const { error } = await deleteWorry(worry.id);
    if (error) addToast(`삭제 실패: ${error}`, 'error');
    else { addToast('삭제되었습니다', 'success'); onDeleted(); }
    setShowDeleteConfirm(false);
  };

  const isOwner = !worry.anonymous && user && worry.author_id === user.id;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';

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
        <h2 className="flex-1 font-heading text-sm font-bold text-text-primary line-clamp-1">{worry.title}</h2>
        {isOwner && (
          <button
            onClick={() => onEdit(worry)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/20 hover:text-accent"
            title="수정"
          >
            <Pencil size={14} />
          </button>
        )}
        {(isOwner || isAdmin) && (
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
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-300">
              {worry.category}
            </span>
            {worry.anonymous && (
              <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] text-text-muted">익명</span>
            )}
            <span className="text-[10px] text-text-muted">👁 {worry.view_count ?? 0}</span>
            <span className="ml-auto text-[10px] text-text-muted">{formatRelativeTime(worry.created_at)}</span>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{worry.content}</p>
        </div>

        {/* 반응 버튼 */}
        <div className="border-b border-white/[.06] px-4 py-3">
          <p className="text-[10px] text-text-muted mb-2">마음을 전해보세요</p>
          <div className="flex gap-2 flex-wrap">
            {WORRY_REACTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleReaction(r)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all ${
                  reactions[r].mine
                    ? 'bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/40'
                    : 'bg-white/[.06] text-text-secondary hover:bg-white/10'
                }`}
              >
                <span>{r}</span>
                <span className="text-[11px] font-semibold">{WORRY_REACTION_LABELS[r]}</span>
                {reactions[r].count > 0 && (
                  <span className="text-[10px] opacity-70">{reactions[r].count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="p-4">
          <p className="text-[11px] font-medium text-text-muted mb-3">
            댓글 {comments.length}개
          </p>
          {loadingComments ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="h-7 w-7 rounded-full bg-white/10 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="h-3 w-3/4 rounded bg-white/[.06]" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-[12px] text-text-muted py-4">첫 댓글을 달아보세요 💬</p>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((c) => {
                const canDelete = (!c.anonymous && user && c.author_id === user.id) || isAdmin;
                return (
                  <div key={c.id} className="flex gap-2.5">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-sm shrink-0"
                      style={{ backgroundColor: c.author_avatar_color + '30' }}
                    >
                      {c.author_avatar_emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-semibold text-text-secondary">{c.author_name}</span>
                        <span className="text-[10px] text-text-muted">{formatRelativeTime(c.created_at)}</span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="ml-auto text-[10px] text-text-muted hover:text-red-400 transition-colors"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      <p className="text-[12px] leading-relaxed text-text-secondary mt-0.5">{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="사연 삭제"
        message="이 사연을 삭제할까요? 삭제 후 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDeleteWorry}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* 댓글 입력 */}
      <div className="border-t border-white/[.06] p-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-text-muted">
            <div
              onClick={() => setCommentAnon(!commentAnon)}
              className={`relative h-4 w-7 rounded-full transition-colors ${
                commentAnon ? 'bg-rose-500/60' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
                  commentAnon ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </div>
            익명
          </label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
            maxLength={500}
            placeholder="따뜻한 한마디를 남겨보세요"
            className="flex-1 rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-rose-500/40"
          />
          <button
            onClick={handleComment}
            disabled={submitting || !commentText.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/70 text-white transition-colors hover:bg-rose-500 disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
