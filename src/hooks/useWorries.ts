import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export const WORRY_REACTIONS = ['🤝', '💪', '🫂', '🙌'] as const;
export type WorryReactionType = (typeof WORRY_REACTIONS)[number];

export const WORRY_REACTION_LABELS: Record<WorryReactionType, string> = {
  '🤝': '공감해요',
  '💪': '응원해요',
  '🫂': '위로해요',
  '🙌': '함께해요',
};

export const WORRY_CATEGORIES = ['일상', '업무', '인간관계', '성장', '기타'] as const;
export type WorryCategory = (typeof WORRY_CATEGORIES)[number];

export interface Worry {
  id: string;
  author_id: string | null;
  anonymous: boolean;
  title: string;
  content: string;
  category: WorryCategory;
  created_at: string;
  comment_count: number;
  reaction_count: number;
  view_count: number;
}

export interface WorryComment {
  id: string;
  worry_id: string;
  author_id: string | null;
  anonymous: boolean;
  content: string;
  created_at: string;
}

export interface WorryCommentWithProfile extends WorryComment {
  author_name: string;
  author_avatar_emoji: string;
  author_avatar_color: string;
}

// 세션 내 중복 조회수 방지 (새로고침 시 초기화)
const viewedIds = new Set<string>();

export function useWorries() {
  const [worries, setWorries] = useState<Worry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorries = useCallback(async (category?: WorryCategory | null) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await withTimeout(
        () => {
          let q = supabase.from('worry_with_counts').select('*');
          if (category) q = q.eq('category', category);
          return q.order('created_at', { ascending: false }).limit(100);
        },
        8000,
        'worries',
      );
      if (fetchErr) throw fetchErr;
      setWorries((data ?? []) as Worry[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      console.error('고민 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorry = useCallback(
    async (input: {
      title: string;
      content: string;
      category: WorryCategory;
      anonymous: boolean;
      author_id: string | null;
    }) => {
      const { data, error: insertErr } = await withTimeout(
        () =>
          supabase
            .from('worries')
            .insert({
              author_id: input.anonymous ? null : input.author_id,
              anonymous: input.anonymous,
              title: input.title,
              content: input.content,
              category: input.category,
            })
            .select()
            .single(),
        10000,
        'createWorry',
      );
      if (insertErr) return { data: null, error: insertErr.message };
      return { data, error: null };
    },
    [],
  );

  const updateWorry = useCallback(
    async (id: string, input: { title?: string; content?: string; category?: WorryCategory }) => {
      const { data, error: updateErr } = await withTimeout(
        () => supabase.from('worries').update(input).eq('id', id).select().single(),
        8000,
        'updateWorry',
      );
      if (updateErr) return { error: updateErr.message };
      setWorries((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
      return { error: null };
    },
    [],
  );

  const deleteWorry = useCallback(async (id: string) => {
    const { data, error: deleteErr } = await withTimeout(
      () => supabase.from('worries').delete().eq('id', id).select('id'),
      8000,
      'deleteWorry',
    );
    if (deleteErr) return { error: deleteErr.message };
    if (!data || data.length === 0) return { error: '삭제 권한이 없거나 이미 삭제된 사연입니다' };
    setWorries((prev) => prev.filter((w) => w.id !== id));
    return { error: null };
  }, []);

  // ── 댓글 ──────────────────────────────────────────────

  const fetchComments = useCallback(async (worryId: string) => {
    const { data: commentData, error: commentErr } = await withTimeout(
      () =>
        supabase
          .from('worry_comments')
          .select('*')
          .eq('worry_id', worryId)
          .order('created_at', { ascending: true }),
      8000,
      'worryComments',
    );
    if (commentErr) return { comments: [] as WorryCommentWithProfile[], error: commentErr.message };

    const comments = (commentData ?? []) as WorryComment[];
    const authorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))] as string[];

    let profileMap = new Map<string, { name: string; avatar_emoji: string; avatar_color: string }>();
    if (authorIds.length > 0) {
      const { data: profiles } = await withTimeout(
        () =>
          supabase
            .from('profiles')
            .select('id, name, avatar_emoji, avatar_color')
            .in('id', authorIds),
        8000,
        'worryCommentProfiles',
      );
      (profiles ?? []).forEach((p: any) =>
        profileMap.set(p.id, {
          name: p.name,
          avatar_emoji: p.avatar_emoji ?? '😊',
          avatar_color: p.avatar_color ?? '#6C5CE7',
        }),
      );
    }

    const result: WorryCommentWithProfile[] = comments.map((c) => {
      const prof = c.author_id ? profileMap.get(c.author_id) : null;
      return {
        ...c,
        author_name: c.anonymous ? '익명' : (prof?.name ?? '알 수 없음'),
        author_avatar_emoji: c.anonymous ? '🎭' : (prof?.avatar_emoji ?? '😊'),
        author_avatar_color: c.anonymous ? '#888' : (prof?.avatar_color ?? '#6C5CE7'),
      };
    });

    return { comments: result, error: null };
  }, []);

  const addComment = useCallback(
    async (input: {
      worry_id: string;
      content: string;
      anonymous: boolean;
      author_id: string | null;
    }) => {
      const { data, error: insertErr } = await withTimeout(
        () =>
          supabase
            .from('worry_comments')
            .insert({
              worry_id: input.worry_id,
              author_id: input.anonymous ? null : input.author_id,
              anonymous: input.anonymous,
              content: input.content,
            })
            .select()
            .single(),
        8000,
        'addWorryComment',
      );
      if (insertErr) return { data: null, error: insertErr.message };
      // 댓글 수 낙관적 업데이트
      setWorries((prev) =>
        prev.map((w) =>
          w.id === input.worry_id ? { ...w, comment_count: w.comment_count + 1 } : w,
        ),
      );
      return { data, error: null };
    },
    [],
  );

  const deleteComment = useCallback(async (commentId: string, worryId: string) => {
    const { error: deleteErr } = await withTimeout(
      () => supabase.from('worry_comments').delete().eq('id', commentId),
      8000,
      'deleteWorryComment',
    );
    if (deleteErr) return { error: deleteErr.message };
    setWorries((prev) =>
      prev.map((w) =>
        w.id === worryId ? { ...w, comment_count: Math.max(0, w.comment_count - 1) } : w,
      ),
    );
    return { error: null };
  }, []);

  // ── 반응 ──────────────────────────────────────────────

  const fetchReactions = useCallback(
    async (worryIds: string[], userId?: string) => {
      if (worryIds.length === 0) return new Map<string, Record<WorryReactionType, { count: number; mine: boolean }>>();

      const { data, error: fetchErr } = await withTimeout(
        () => supabase.from('worry_reactions').select('worry_id, user_id, reaction').in('worry_id', worryIds),
        8000,
        'worryReactions',
      );
      if (fetchErr) {
        console.error('반응 조회 실패:', fetchErr.message);
        return new Map<string, Record<WorryReactionType, { count: number; mine: boolean }>>();
      }

      const emptyReactions = (): Record<WorryReactionType, { count: number; mine: boolean }> =>
        Object.fromEntries(WORRY_REACTIONS.map((r) => [r, { count: 0, mine: false }])) as Record<
          WorryReactionType,
          { count: number; mine: boolean }
        >;

      const map = new Map<string, Record<WorryReactionType, { count: number; mine: boolean }>>();
      (data ?? []).forEach((row: any) => {
        if (!map.has(row.worry_id)) map.set(row.worry_id, emptyReactions());
        const r = map.get(row.worry_id)!;
        const emoji = row.reaction as WorryReactionType;
        if (r[emoji]) {
          r[emoji].count++;
          if (userId && row.user_id === userId) r[emoji].mine = true;
        }
      });
      return map;
    },
    [],
  );

  const toggleReaction = useCallback(
    async (worryId: string, userId: string, reaction: WorryReactionType) => {
      const { data: existing } = await supabase
        .from('worry_reactions')
        .select('worry_id')
        .eq('worry_id', worryId)
        .eq('user_id', userId)
        .eq('reaction', reaction)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('worry_reactions')
          .delete()
          .eq('worry_id', worryId)
          .eq('user_id', userId)
          .eq('reaction', reaction);
        if (error) throw error;
        return { toggled: false };
      } else {
        const { error } = await supabase
          .from('worry_reactions')
          .insert({ worry_id: worryId, user_id: userId, reaction });
        if (error) throw error;
        return { toggled: true };
      }
    },
    [],
  );

  const incrementViewCount = useCallback(async (id: string) => {
    if (viewedIds.has(id)) return;
    viewedIds.add(id);
    setWorries((prev) => prev.map((w) => w.id === id ? { ...w, view_count: (w.view_count ?? 0) + 1 } : w));
    await supabase.rpc('increment_view_count', { p_table: 'worries', p_id: id });
  }, []);

  return {
    worries,
    loading,
    error,
    fetchWorries,
    createWorry,
    updateWorry,
    deleteWorry,
    fetchComments,
    addComment,
    deleteComment,
    fetchReactions,
    toggleReaction,
    incrementViewCount,
  };
}
