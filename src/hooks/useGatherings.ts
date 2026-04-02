import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { Gathering, GatheringMember, GatheringComment, Profile } from '../types';
import type { GatheringCategory, GatheringStatus } from '../lib/constants';

export interface GatheringFilters {
  category?: GatheringCategory | null;
  status?: GatheringStatus | null;
  sort?: 'newest' | 'oldest';
}

// 세션 내 중복 조회수 방지 (새로고침 시 초기화)
const viewedIds = new Set<string>();

export function useGatherings() {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGatherings = useCallback(async (filters: GatheringFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const buildQuery = () => {
        const asc = filters.sort === 'oldest';
        let q = supabase.from('gatherings').select('*').order('created_at', { ascending: asc });
        if (filters.category) q = q.eq('category', filters.category);
        if (filters.status) q = q.eq('status', filters.status);
        return q;
      };

      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'gatherings');
      if (fetchError) throw fetchError;
      setGatherings((data as Gathering[]) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '모임 목록을 불러올 수 없습니다';
      console.error('모임 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGathering = useCallback(
    async (input: {
      author_id: string;
      title: string;
      description: string;
      category: GatheringCategory;
      max_members: number | null;
      contact_info: string | null;
      deadline: string | null;
    }) => {
      const { data, error: insertError } = await supabase
        .from('gatherings')
        .insert({
          author_id: input.author_id,
          title: input.title,
          description: input.description,
          category: input.category,
          max_members: input.max_members,
          contact_info: input.contact_info,
          deadline: input.deadline,
        })
        .select()
        .single();

      if (insertError) {
        console.error('모임 등록 실패:', insertError.message);
        return { data: null, error: insertError.message };
      }

      // 작성자를 자동으로 참여자에 추가
      if (data) {
        await supabase
          .from('gathering_members')
          .insert({ gathering_id: data.id, user_id: input.author_id, joined_at: new Date().toISOString() });
      }

      return { data, error: null };
    },
    []
  );

  const updateGathering = useCallback(
    async (
      id: string,
      updates: {
        title?: string;
        description?: string;
        category?: GatheringCategory;
        max_members?: number | null;
        contact_info?: string | null;
        deadline?: string | null;
      },
    ) => {
      const { data, error: updateError } = await supabase
        .from('gatherings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('모임 수정 실패:', updateError.message);
        return { data: null, error: updateError.message };
      }

      setGatherings((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...data } : g))
      );
      return { data: data as Gathering, error: null };
    },
    []
  );

  const closeGathering = useCallback(async (id: string) => {
    const { error: updateError } = await supabase
      .from('gatherings')
      .update({ status: 'closed' })
      .eq('id', id);

    if (updateError) {
      console.error('모임 마감 실패:', updateError.message);
      return { error: updateError.message };
    }

    setGatherings((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: 'closed' as const } : g))
    );
    return { error: null };
  }, []);

  const joinGathering = useCallback(async (gatheringId: string, userId: string) => {
    // 낙관적 업데이트
    setGatherings((prev) =>
      prev.map((g) =>
        g.id === gatheringId ? { ...g, member_count: g.member_count + 1 } : g
      )
    );

    const { error: joinError } = await supabase
      .from('gathering_members')
      .insert({ gathering_id: gatheringId, user_id: userId, joined_at: new Date().toISOString() });

    if (joinError) {
      // 롤백
      setGatherings((prev) =>
        prev.map((g) =>
          g.id === gatheringId ? { ...g, member_count: g.member_count - 1 } : g
        )
      );
      console.error('모임 참여 실패:', joinError.message);
      return { error: joinError.message };
    }

    // 트리거가 member_count를 갱신하므로 DB에서 최신값 반영
    const { data: updated } = await supabase
      .from('gatherings')
      .select('member_count')
      .eq('id', gatheringId)
      .single();
    if (updated) {
      setGatherings((prev) =>
        prev.map((g) => (g.id === gatheringId ? { ...g, member_count: updated.member_count } : g))
      );
    }

    return { error: null };
  }, []);

  const leaveGathering = useCallback(async (gatheringId: string, userId: string) => {
    // 낙관적 업데이트
    setGatherings((prev) =>
      prev.map((g) =>
        g.id === gatheringId ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g
      )
    );

    const { error: leaveError } = await supabase
      .from('gathering_members')
      .delete()
      .eq('gathering_id', gatheringId)
      .eq('user_id', userId);

    if (leaveError) {
      // 롤백
      setGatherings((prev) =>
        prev.map((g) =>
          g.id === gatheringId ? { ...g, member_count: g.member_count + 1 } : g
        )
      );
      console.error('모임 취소 실패:', leaveError.message);
      return { error: leaveError.message };
    }

    // 트리거가 member_count를 갱신하므로 DB에서 최신값 반영
    const { data: updated } = await supabase
      .from('gatherings')
      .select('member_count')
      .eq('id', gatheringId)
      .single();
    if (updated) {
      setGatherings((prev) =>
        prev.map((g) => (g.id === gatheringId ? { ...g, member_count: updated.member_count } : g))
      );
    }

    return { error: null };
  }, []);

  // 내가 참여한 모임 ID 세트
  const fetchMyJoins = useCallback(async (userId: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('gathering_members').select('gathering_id').eq('user_id', userId),
      8000, 'myJoins',
    );
    if (error) console.error('참여 목록 조회 실패:', error.message);
    return new Set((data ?? []).map((m) => m.gathering_id));
  }, []);

  // 마감된 모임의 참여자 목록 (프로필 포함)
  const fetchMembers = useCallback(async (gatheringId: string) => {
    const { data, error: fetchError } = await withTimeout(
      () => supabase.from('gathering_members').select('gathering_id, user_id, joined_at').eq('gathering_id', gatheringId),
      8000, 'gatheringMembers',
    );

    if (fetchError) {
      console.error('참여자 조회 실패:', fetchError.message);
      return { members: [], profiles: [] };
    }

    const members = (data ?? []) as GatheringMember[];
    if (members.length === 0) return { members, profiles: [] };

    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await withTimeout(
      () => supabase.from('profiles').select('id, name, nickname, team, avatar_emoji, avatar_color').in('id', userIds),
      8000, 'memberProfiles',
    );
    if (profilesError) console.error('참여자 프로필 조회 실패:', profilesError.message);

    return { members, profiles: (profiles ?? []) as Pick<Profile, 'id' | 'name' | 'nickname' | 'team' | 'avatar_emoji' | 'avatar_color'>[] };
  }, []);

  // ===== 댓글 =====

  const fetchComments = useCallback(async (gatheringId: string) => {
    const { data, error: fetchError } = await withTimeout(
      () =>
        supabase
          .from('gathering_comments')
          .select('id, gathering_id, author_id, content, created_at')
          .eq('gathering_id', gatheringId)
          .order('created_at', { ascending: true }),
      8000,
      'gatheringComments',
    );

    if (fetchError) {
      console.error('댓글 조회 실패:', fetchError.message);
      return { comments: [] as GatheringComment[], error: fetchError.message };
    }

    // 작성자 프로필 조회
    const comments = (data ?? []) as GatheringComment[];
    const authorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))] as string[];
    let profiles: Pick<Profile, 'id' | 'name' | 'nickname' | 'avatar_emoji' | 'avatar_color'>[] = [];

    if (authorIds.length > 0) {
      const { data: pData } = await withTimeout(
        () => supabase.from('profiles').select('id, name, nickname, avatar_emoji, avatar_color').in('id', authorIds),
        8000,
        'commentProfiles',
      );
      profiles = (pData ?? []) as typeof profiles;
    }

    return { comments, profiles, error: null };
  }, []);

  const addComment = useCallback(async (gatheringId: string, authorId: string, content: string) => {
    const { data, error: insertError } = await supabase
      .from('gathering_comments')
      .insert({ gathering_id: gatheringId, author_id: authorId, content })
      .select()
      .single();

    if (insertError) {
      console.error('댓글 등록 실패:', insertError.message);
      return { data: null, error: insertError.message };
    }
    return { data: data as GatheringComment, error: null };
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    const { error: deleteError } = await supabase
      .from('gathering_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('댓글 삭제 실패:', deleteError.message);
      return { error: deleteError.message };
    }
    return { error: null };
  }, []);

  const deleteGathering = useCallback(async (id: string) => {
    // gathering_members, gathering_comments는 FK CASCADE로 자동 삭제
    const { data, error: deleteError } = await supabase
      .from('gatherings')
      .delete()
      .eq('id', id)
      .select('id');

    if (deleteError) {
      console.error('모임 삭제 실패:', deleteError.message);
      return { error: deleteError.message };
    }
    if (!data || data.length === 0) {
      return { error: '삭제 권한이 없거나 이미 삭제된 모임입니다' };
    }

    // 관련 알림 정리 (실패해도 무시)
    supabase.from('notifications').delete().eq('link', `/gathering/${id}`).then();

    setGatherings((prev) => prev.filter((g) => g.id !== id));
    return { error: null };
  }, []);

  const incrementViewCount = useCallback(async (id: string) => {
    if (viewedIds.has(id)) return;
    viewedIds.add(id);
    setGatherings((prev) => prev.map((g) => g.id === id ? { ...g, view_count: (g.view_count ?? 0) + 1 } : g));
    await supabase.rpc('increment_view_count', { p_table: 'gatherings', p_id: id });
  }, []);

  return {
    gatherings,
    loading,
    error,
    fetchGatherings,
    createGathering,
    updateGathering,
    closeGathering,
    joinGathering,
    leaveGathering,
    fetchMyJoins,
    fetchMembers,
    fetchComments,
    addComment,
    deleteComment,
    deleteGathering,
    incrementViewCount,
  };
}
