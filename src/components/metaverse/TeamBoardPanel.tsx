import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, RefreshCw, Send, X } from 'lucide-react';
import { useTeamPosts } from '../../hooks/useTeamPosts';
import type { TeamPostWithCounts } from '../../hooks/useTeamPosts';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import TeamPostCard from './TeamPostCard';
import LoadMore from '../common/LoadMore';

const CATEGORIES = ['자유', '질문', '정보', '잡담'] as const;
const FILTER_STYLES: Record<string, string> = {
  '전체': 'bg-white/[.1] text-text-primary',
  '자유': 'bg-emerald-500/20 text-emerald-400',
  '질문': 'bg-blue-500/20 text-blue-400',
  '정보': 'bg-amber-500/20 text-amber-400',
  '잡담': 'bg-purple-500/20 text-purple-400',
};

interface TeamBoardPanelProps {
  team: string;
  readOnly: boolean;
}

export default function TeamBoardPanel({ team, readOnly }: TeamBoardPanelProps) {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const { posts, comments, loading, error, fetchPosts, createPost, updatePost, deletePost, toggleLike, fetchComments, addComment, incrementViewCount } = useTeamPosts();

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<string>('자유');
  const [content, setContent] = useState('');
  const [filter, setFilter] = useState('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [editTarget, setEditTarget] = useState<TeamPostWithCounts | null>(null);

  const reload = useCallback(() => { fetchPosts(team, profile?.id); }, [fetchPosts, team, profile?.id]);
  useEffect(() => { reload(); }, [reload]);

  const handleSubmit = async () => {
    if (!profile || !content.trim()) return;
    setSubmitting(true);
    try {
      if (editTarget) {
        const { error } = await updatePost(editTarget.id, { content: content.trim(), category });
        if (error) { addToast(`수정 실패: ${error}`, 'error'); return; }
        addToast('게시글이 수정되었습니다', 'success');
        setEditTarget(null);
      } else {
        await createPost(profile.id, team, content.trim(), category);
        addToast('게시글이 등록되었습니다', 'success');
      }
      setShowForm(false);
      setContent('');
      reload();
    } catch {
      addToast(editTarget ? '게시글 수정 실패' : '게시글 등록 실패', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = (post: TeamPostWithCounts) => {
    setEditTarget(post);
    setContent(post.content);
    setCategory(post.category);
    setShowForm(true);
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await deletePost(postId);
    if (error) { addToast(`삭제 실패: ${error}`, 'error'); return; }
    addToast('게시글이 삭제되었습니다', 'success');
  };

  const handleToggleLike = async (postId: string) => {
    if (!profile) return;
    try { await toggleLike(postId, profile.id); }
    catch { addToast('좋아요 처리 실패', 'error'); reload(); }
  };

  const handleExpandComments = async (postId: string) => {
    if (expandedId === postId) { setExpandedId(null); return; }
    setExpandedId(postId);
    incrementViewCount(postId);
    try { await fetchComments(postId); }
    catch { addToast('댓글 조회 실패', 'error'); }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!profile) return;
    try {
      await addComment(postId, profile.id, text);
      await fetchComments(postId);
    } catch { addToast('댓글 등록 실패', 'error'); }
  };

  const filtered = filter === '전체' ? posts : posts.filter((p) => p.category === filter);

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary font-heading">팀 게시판</h3>
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="flex items-center gap-1 rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] text-text-muted">
              <Eye size={10} /> 읽기 전용
            </span>
          )}
          {!readOnly && (
            <button onClick={() => { setShowForm(!showForm); setEditTarget(null); setContent(''); }}
              className="flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/30">
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? '취소' : '글쓰기'}
            </button>
          )}
        </div>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="rounded-xl border border-accent/20 bg-accent/[.04] p-3 space-y-2.5">
          {/* 카테고리 선택 */}
          <div className="flex gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                  category === c ? FILTER_STYLES[c] : 'bg-white/[.04] text-text-muted hover:bg-white/[.08]'
                }`}>
                {c}
              </button>
            ))}
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="자유롭게 이야기해보세요..."
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">{content.length}/500</span>
            <button onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-accent/80 disabled:opacity-30">
              <Send size={11} /> {editTarget ? '수정' : '게시'}
            </button>
          </div>
        </div>
      )}

      {/* 카테고리 필터 */}
      {!showForm && (
        <div className="flex gap-1">
          {['전체', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                filter === c ? (FILTER_STYLES[c] ?? 'bg-white/[.1] text-text-primary') : 'text-text-muted hover:text-text-secondary'
              }`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* 게시글 리스트 */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-2xl mb-2">⚠️</span>
          <p className="text-xs text-text-muted mb-2">{error}</p>
          <button onClick={reload} className="flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/30">
            <RefreshCw size={12} /> 새로고침
          </button>
        </div>
      ) : loading ? (
        <div className="py-6 text-center text-xs text-text-muted">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-3xl mb-2">📝</p>
          <p className="text-xs text-text-muted">아직 게시글이 없어요</p>
          <p className="text-[10px] text-text-muted mt-1">{readOnly ? '' : '첫 글을 남겨보세요!'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.slice(0, displayCount).map((p) => (
            <TeamPostCard key={p.id} post={p} readOnly={readOnly} userId={profile?.id}
              comments={expandedId === p.id ? comments : []}
              expanded={expandedId === p.id}
              onToggleLike={handleToggleLike}
              onExpandComments={handleExpandComments}
              onAddComment={handleAddComment}
              onEdit={handleEditPost}
              onDelete={handleDeletePost} />
          ))}
          <LoadMore current={Math.min(displayCount, filtered.length)} total={filtered.length} onLoadMore={() => setDisplayCount((c) => c + 20)} />
        </div>
      )}
    </div>
  );
}
