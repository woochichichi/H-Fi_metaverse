import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { Gathering, GatheringMember, Profile } from '../types';
import type { GatheringCategory, GatheringStatus } from '../lib/constants';

export interface GatheringFilters {
  category?: GatheringCategory | null;
  status?: GatheringStatus | null;
}

export function useGatherings() {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGatherings = useCallback(async (filters: GatheringFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('gatherings')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await withTimeout(query, 8000, 'gatherings');
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
      return { data, error: null };
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
    return { error: null };
  }, []);

  const leaveGathering = useCallback(async (gatheringId: string, userId: string) => {
    // 낙관적 업데이트
    setGatherings((prev) =>
      prev.map((g) =>
        g.id === gatheringId ? { ...g, member_count: g.member_count - 1 } : g
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
    return { error: null };
  }, []);

  // 내가 참여한 모임 ID 세트
  const fetchMyJoins = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('gathering_members')
      .select('gathering_id')
      .eq('user_id', userId);

    return new Set((data ?? []).map((m) => m.gathering_id));
  }, []);

  // 마감된 모임의 참여자 목록 (프로필 포함)
  const fetchMembers = useCallback(async (gatheringId: string) => {
    const { data, error: fetchError } = await supabase
      .from('gathering_members')
      .select('gathering_id, user_id, joined_at')
      .eq('gathering_id', gatheringId);

    if (fetchError) {
      console.error('참여자 조회 실패:', fetchError.message);
      return { members: [], profiles: [] };
    }

    const members = (data ?? []) as GatheringMember[];
    if (members.length === 0) return { members, profiles: [] };

    const userIds = members.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, nickname, team, avatar_emoji, avatar_color')
      .in('id', userIds);

    return { members, profiles: (profiles ?? []) as Pick<Profile, 'id' | 'name' | 'nickname' | 'team' | 'avatar_emoji' | 'avatar_color'>[] };
  }, []);

  return {
    gatherings,
    loading,
    error,
    fetchGatherings,
    createGathering,
    closeGathering,
    joinGathering,
    leaveGathering,
    fetchMyJoins,
    fetchMembers,
  };
}
