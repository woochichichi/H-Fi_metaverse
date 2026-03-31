import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export const REACTION_EMOJIS = ['👏', '💪', '🔥', '❤️', '😊', '🎉'] as const;
export type ReactionType = (typeof REACTION_EMOJIS)[number];

export interface KudosWithCounts {
  id: string;
  author_id: string;
  target_id: string;
  team: string;
  message: string;
  created_at: string;
  target_name: string;
  reactions: Record<ReactionType, { count: number; mine: boolean }>;
  is_mine: boolean;
}

export function useKudos() {
  const [kudosList, setKudosList] = useState<KudosWithCounts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKudos = useCallback(async (team: string, userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await withTimeout(
        () => supabase.from('kudos').select('*').eq('team', team).order('created_at', { ascending: false }).limit(100),
        8000, 'kudos',
      );
      if (fetchErr) throw fetchErr;
      const items = data ?? [];

      // 대상 이름 조회
      const targetIds = [...new Set(items.map((k: any) => k.target_id))];
      let nameMap = new Map<string, string>();
      if (targetIds.length > 0) {
        const { data: profiles, error: profileErr } = await withTimeout(
          () => supabase.from('profiles').select('id, name').in('id', targetIds),
          8000, 'kudosProfiles',
        );
        if (profileErr) console.error('칭찬 대상 조회 실패:', profileErr.message);
        (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.name));
      }

      // 반응 조회
      const ids = items.map((k: any) => k.id);
      const reactionsMap = new Map<string, Record<ReactionType, { count: number; mine: boolean }>>();
      if (ids.length > 0) {
        const { data: likes, error: likeErr } = await withTimeout(
          () => supabase.from('kudos_likes').select('kudos_id, user_id, reaction').in('kudos_id', ids),
          8000, 'kudosLikes',
        );
        if (likeErr) console.error('칭찬 반응 조회 실패:', likeErr.message);
        (likes ?? []).forEach((l: any) => {
          if (!reactionsMap.has(l.kudos_id)) {
            reactionsMap.set(l.kudos_id, Object.fromEntries(
              REACTION_EMOJIS.map(e => [e, { count: 0, mine: false }])
            ) as Record<ReactionType, { count: number; mine: boolean }>);
          }
          const r = reactionsMap.get(l.kudos_id)!;
          const emoji = l.reaction as ReactionType;
          if (r[emoji]) {
            r[emoji].count++;
            if (userId && l.user_id === userId) r[emoji].mine = true;
          }
        });
      }

      const emptyReactions = () => Object.fromEntries(
        REACTION_EMOJIS.map(e => [e, { count: 0, mine: false }])
      ) as Record<ReactionType, { count: number; mine: boolean }>;

      const withCounts: KudosWithCounts[] = items.map((k: any) => ({
        id: k.id,
        author_id: k.author_id,
        target_id: k.target_id,
        team: k.team,
        message: k.message,
        created_at: k.created_at,
        target_name: nameMap.get(k.target_id) ?? '알 수 없음',
        reactions: reactionsMap.get(k.id) ?? emptyReactions(),
        is_mine: userId === k.author_id,
      }));

      setKudosList(withCounts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '칭찬 조회 실패';
      console.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createKudos = useCallback(
    async (authorId: string, targetId: string, team: string, message: string) => {
      const { error } = await supabase
        .from('kudos')
        .insert({ author_id: authorId, target_id: targetId, team, message });
      if (error) throw error;
    },
    [],
  );

  const toggleReaction = useCallback(
    async (kudosId: string, userId: string, reaction: ReactionType) => {
      // 낙관적 업데이트
      setKudosList((prev) =>
        prev.map((k) => {
          if (k.id !== kudosId) return k;
          const r = { ...k.reactions };
          const cur = r[reaction];
          r[reaction] = { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine };
          return { ...k, reactions: r };
        }),
      );

      const { data: existing } = await supabase
        .from('kudos_likes')
        .select('kudos_id')
        .eq('kudos_id', kudosId)
        .eq('user_id', userId)
        .eq('reaction', reaction)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('kudos_likes')
          .delete()
          .eq('kudos_id', kudosId)
          .eq('user_id', userId)
          .eq('reaction', reaction);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kudos_likes')
          .insert({ kudos_id: kudosId, user_id: userId, reaction });
        if (error) throw error;
      }
    },
    [],
  );

  const deleteKudos = useCallback(async (kudosId: string) => {
    const { error } = await withTimeout(
      () => supabase.from('kudos').delete().eq('id', kudosId),
      8000, 'kudosDelete',
    );
    if (error) throw error;
    setKudosList((prev) => prev.filter((k) => k.id !== kudosId));
  }, []);

  const fetchTeamMembers = useCallback(async (team: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('profiles').select('id, name').eq('team', team).neq('status', '퇴사').order('name'),
      8000, 'teamMembers',
    );
    if (error) throw error;
    return (data ?? []) as { id: string; name: string }[];
  }, []);

  return { kudosList, loading, error, fetchKudos, createKudos, toggleReaction, deleteKudos, fetchTeamMembers };
}
