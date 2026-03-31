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
}

export interface PostCommentWithAuthor {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
}

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
          () => supabase.from('profiles').select('id, name').in('id', authorIds),
          8000, 'postAuthors',
        );
        if (profileErr) console.error('게시글 작성자 조회 실패:', profileErr.message);
        (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.name));
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
      const { error } = await supabase
        .from('team_posts')
        .insert({ author_id: authorId, team, content, category });
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
        () => supabase.from('profiles').select('id, name').in('id', authorIds),
        8000, 'commentAuthors',
      );
      (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.name));
    }

    const withAuthors: PostCommentWithAuthor[] = (data ?? []).map((c: any) => ({
      ...c,
      author_name: c.author_id ? nameMap.get(c.author_id) ?? null : null,
    }));

    setComments(withAuthors);
  }, []);

  const addComment = useCallback(
    async (postId: string, authorId: string, content: string) => {
      const { error } = await supabase
        .from('team_post_comments')
        .insert({ post_id: postId, author_id: authorId, content });
      if (error) throw error;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p,
        ),
      );
    },
    [],
  );

  return { posts, comments, loading, error, fetchPosts, createPost, toggleLike, fetchComments, addComment };
}
