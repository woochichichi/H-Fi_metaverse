import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { UnitActivity, ActivityComment } from '../types';

export interface UnitActivityWithCounts extends UnitActivity {
  reaction_count: number;
  comment_count: number;
  my_reaction: boolean;
}

export interface CommentWithAuthor extends ActivityComment {
  author_name: string | null;
}

export function useUnitActivities() {
  const [activities, setActivities] = useState<UnitActivityWithCounts[]>([]);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (team: string, userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await withTimeout(
        () => supabase.from('unit_activities').select('*').eq('team', team).order('status', { ascending: true }).order('created_at', { ascending: false }),
        8000, 'unitActivities',
      );

      if (fetchErr) throw fetchErr;
      const items = data ?? [];

      // 반응 수 조회
      const ids = items.map((a) => a.id);
      let reactionCounts = new Map<string, number>();
      let myReactions = new Set<string>();

      if (ids.length > 0) {
        const { data: reactions, error: reactErr } = await withTimeout(
          () => supabase.from('activity_reactions').select('activity_id, user_id').in('activity_id', ids),
          8000, 'activityReactions',
        );
        if (reactErr) console.error('반응 조회 실패:', reactErr.message);

        (reactions ?? []).forEach((r) => {
          reactionCounts.set(r.activity_id, (reactionCounts.get(r.activity_id) ?? 0) + 1);
          if (userId && r.user_id === userId) myReactions.add(r.activity_id);
        });

        // 댓글 수 조회
        const { data: cmts, error: cmtErr } = await withTimeout(
          () => supabase.from('activity_comments').select('activity_id').in('activity_id', ids),
          8000, 'activityComments',
        );
        if (cmtErr) console.error('댓글 수 조회 실패:', cmtErr.message);

        var commentCounts = new Map<string, number>();
        (cmts ?? []).forEach((c) => {
          commentCounts.set(c.activity_id, (commentCounts.get(c.activity_id) ?? 0) + 1);
        });
      }

      const withCounts: UnitActivityWithCounts[] = items.map((a) => ({
        ...a,
        reaction_count: reactionCounts.get(a.id) ?? 0,
        comment_count: commentCounts?.get(a.id) ?? 0,
        my_reaction: myReactions.has(a.id),
      }));

      // 진행중 우선 → 계획 → 보류 → 완료
      const ORDER: Record<string, number> = { '진행중': 0, '계획': 1, '보류': 2, '완료': 3 };
      withCounts.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));

      setActivities(withCounts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '활동 조회 실패';
      console.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createActivity = useCallback(
    async (input: {
      author_id: string;
      team: string;
      unit: string | null;
      title: string;
      description: string | null;
      category: string | null;
      status: string;
    }) => {
      const { data, error } = await supabase
        .from('unit_activities')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as UnitActivity;
    },
    [],
  );

  const updateActivityStatus = useCallback(
    async (id: string, status: string) => {
      const { error } = await supabase
        .from('unit_activities')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    [],
  );

  const toggleReaction = useCallback(
    async (activityId: string, userId: string) => {
      // 낙관적 업데이트
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? {
                ...a,
                my_reaction: !a.my_reaction,
                reaction_count: a.reaction_count + (a.my_reaction ? -1 : 1),
              }
            : a,
        ),
      );

      const { data: existing } = await supabase
        .from('activity_reactions')
        .select('activity_id')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('activity_reactions')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('activity_reactions')
          .insert({ activity_id: activityId, user_id: userId });
        if (error) throw error;
      }
    },
    [],
  );

  const fetchComments = useCallback(async (activityId: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('activity_comments').select('*').eq('activity_id', activityId).order('created_at', { ascending: true }),
      8000, 'comments',
    );

    if (error) throw error;

    const authorIds = [...new Set((data ?? []).filter((c) => c.author_id).map((c) => c.author_id!))];
    let nameMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles, error: profileErr } = await withTimeout(
        () => supabase.from('profiles').select('id, name, nickname').in('id', authorIds),
        8000, 'commentAuthors',
      );
      if (profileErr) console.error('댓글 작성자 조회 실패:', profileErr.message);
      (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.nickname || p.name));
    }

    const withAuthors: CommentWithAuthor[] = (data ?? []).map((c) => ({
      ...c,
      author_name: c.author_id ? nameMap.get(c.author_id) ?? null : null,
    }));

    setComments(withAuthors);
  }, []);

  const updateActivity = useCallback(
    async (
      id: string,
      input: { title?: string; description?: string | null; category?: string | null; status?: string; unit?: string | null },
    ) => {
      const { data, error } = await withTimeout(
        () => supabase.from('unit_activities').update(input).eq('id', id).select().single(),
        8000, 'updateActivity',
      );
      if (error) return { error: error.message };
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
      return { error: null };
    },
    [],
  );

  const deleteActivity = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('unit_activities')
      .delete()
      .eq('id', id)
      .select('id');
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: '삭제 권한이 없거나 이미 삭제된 활동입니다' };
    setActivities((prev) => prev.filter((a) => a.id !== id));
    return { error: null };
  }, []);

  const addComment = useCallback(
    async (activityId: string, authorId: string, content: string) => {
      const { error } = await supabase
        .from('activity_comments')
        .insert({ activity_id: activityId, author_id: authorId, content });
      if (error) throw error;

      // 댓글 수 낙관적 업데이트
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId ? { ...a, comment_count: a.comment_count + 1 } : a,
        ),
      );
    },
    [],
  );

  return {
    activities,
    comments,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    toggleReaction,
    fetchComments,
    addComment,
  };
}
