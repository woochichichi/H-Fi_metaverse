import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export interface TeamPostWithCounts {
  id: string;
  author_id: string;
  team: string;
  content: string;
  category: string;
  created_at: string;
  author_name: string;
  like_count: number;
  comment_count: number;
  my_like: boolean;
  view_count: number;
}

export interface PostCommentWithAuthor {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
}

// 세션 내 중복 조회수 방지 (새로고침 시 초기화)
const viewedIds = new Set<string>();

export function useTeamPosts() {
  const [posts, setPosts] = useState<TeamPostWithCounts[]>([]);
  const [comments, setComments] = useState<PostCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (team: string, userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await withTimeout(
        () => supabase.from('team_posts').select('*').eq('team', team).order('created_at', { ascending: false }).limit(100),
        8000, 'teamPosts',
      );
      if (fetchErr) throw fetchErr;
      const items = data ?? [];

      // 작성자 이름
      const authorIds = [...new Set(items.map((p: any) => p.author_id))];
      let nameMap = new Map<string, string>();
      if (authorIds.length > 0) {
        const { data: profiles, error: profileErr } = await withTimeout(
          () => supabase.from('profiles').select('id, name, nickname').in('id', authorIds),
          8000, 'postAuthors',
        );
        if (profileErr) console.error('게시글 작성자 조회 실패:', profileErr.message);
        (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.nickname || p.name));
      }

      // 좋아요 + 댓글 수
      const ids = items.map((p: any) => p.id);
      let likeCounts = new Map<string, number>();
      let myLikes = new Set<string>();
      let commentCounts = new Map<string, number>();

      if (ids.length > 0) {
        const [likesRes, cmtRes] = await Promise.all([
          withTimeout(
            () => supabase.from('team_post_likes').select('post_id, user_id').in('post_id', ids),
            8000, 'postLikes',
          ),
          withTimeout(
            () => supabase.from('team_post_comments').select('post_id').in('post_id', ids),
            8000, 'postCommentCounts',
          ),
        ]);

        if (likesRes.error) console.error('게시글 좋아요 조회 실패:', likesRes.error.message);
        if (cmtRes.error) console.error('게시글 댓글 수 조회 실패:', cmtRes.error.message);

        (likesRes.data ?? []).forEach((l: any) => {
          likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1);
          if (userId && l.user_id === userId) myLikes.add(l.post_id);
        });

        (cmtRes.data ?? []).forEach((c: any) => {
          commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);
        });
      }

      const withCounts: TeamPostWithCounts[] = items.map((p: any) => ({
        ...p,
        author_name: nameMap.get(p.author_id) ?? '알 수 없음',
        like_count: likeCounts.get(p.id) ?? 0,
        comment_count: commentCounts.get(p.id) ?? 0,
        my_like: myLikes.has(p.id),
      }));

      setPosts(withCounts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '게시글 조회 실패';
      console.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(
    async (authorId: string, team: string, content: string, category: string) => {
      const { error } = await withTimeout(
        () => supabase.from('team_posts').insert({ author_id: authorId, team, content, category }),
        8000, 'createPost',
      );
      if (error) throw error;
    },
    [],
  );

  const toggleLike = useCallback(
    async (postId: string, userId: string) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, my_like: !p.my_like, like_count: p.like_count + (p.my_like ? -1 : 1) }
            : p,
        ),
      );

      const { data: existing } = await supabase
        .from('team_post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('team_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_post_likes')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    [],
  );

  const fetchComments = useCallback(async (postId: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('team_post_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
      8000, 'postComments',
    );
    if (error) throw error;

    const authorIds = [...new Set((data ?? []).filter((c: any) => c.author_id).map((c: any) => c.author_id))];
    let nameMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles } = await withTimeout(
        () => supabase.from('profiles').select('id, name, nickname').in('id', authorIds),
        8000, 'commentAuthors',
      );
      (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.nickname || p.name));
    }

    const withAuthors: PostCommentWithAuthor[] = (data ?? []).map((c: any) => ({
      ...c,
      author_name: c.author_id ? nameMap.get(c.author_id) ?? null : null,
    }));

    setComments(withAuthors);
  }, []);

  const updatePost = useCallback(
    async (id: string, input: { content?: string; category?: string }) => {
      const { data, error } = await withTimeout(
        () => supabase.from('team_posts').update(input).eq('id', id).select().single(),
        8000, 'updatePost',
      );
      if (error) return { error: error.message };
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      return { error: null };
    },
    [],
  );

  const deletePost = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('team_posts')
      .delete()
      .eq('id', id)
      .select('id');
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: '삭제 권한이 없거나 이미 삭제된 게시글입니다' };
    setPosts((prev) => prev.filter((p) => p.id !== id));
    return { error: null };
  }, []);

  const addComment = useCallback(
    async (postId: string, authorId: string, content: string) => {
      const { error } = await withTimeout(
        () => supabase.from('team_post_comments').insert({ post_id: postId, author_id: authorId, content }),
        8000, 'addComment',
      );
      if (error) throw error;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p,
        ),
      );
    },
    [],
  );

  const deleteComment = useCallback(async (commentId: string, postId: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('team_post_comments').delete().eq('id', commentId).select('id'),
      8000, 'deleteTeamComment',
    );
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: '삭제 권한이 없거나 이미 삭제된 댓글입니다' };
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p));
    return { error: null };
  }, []);

  const incrementViewCount = useCallback(async (id: string) => {
    if (viewedIds.has(id)) return;
    viewedIds.add(id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, view_count: (p.view_count ?? 0) + 1 } : p));
    await supabase.rpc('increment_view_count', { p_table: 'team_posts', p_id: id });
  }, []);

  return { posts, comments, loading, error, fetchPosts, createPost, updatePost, deletePost, toggleLike, fetchComments, addComment, deleteComment, incrementViewCount };
}
