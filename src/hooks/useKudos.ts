import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export interface KudosWithCounts {
  id: string;
  author_id: string;
  target_id: string;
  team: string;
  message: string;
  created_at: string;
  author_name: string;
  target_name: string;
  like_count: number;
  my_like: boolean;
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

      // 작성자/대상 이름 조회
      const userIds = [...new Set(items.flatMap((k: any) => [k.author_id, k.target_id]))];
      let nameMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles, error: profileErr } = await withTimeout(
          () => supabase.from('profiles').select('id, name').in('id', userIds),
          8000, 'kudosProfiles',
        );
        if (profileErr) console.error('칭찬 작성자 조회 실패:', profileErr.message);
        (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.name));
      }

      // 좋아요 수 조회
      const ids = items.map((k: any) => k.id);
      let likeCounts = new Map<string, number>();
      let myLikes = new Set<string>();
      if (ids.length > 0) {
        const { data: likes, error: likeErr } = await withTimeout(
          () => supabase.from('kudos_likes').select('kudos_id, user_id').in('kudos_id', ids),
          8000, 'kudosLikes',
        );
        if (likeErr) console.error('칭찬 좋아요 조회 실패:', likeErr.message);
        (likes ?? []).forEach((l: any) => {
          likeCounts.set(l.kudos_id, (likeCounts.get(l.kudos_id) ?? 0) + 1);
          if (userId && l.user_id === userId) myLikes.add(l.kudos_id);
        });
      }

      const withCounts: KudosWithCounts[] = items.map((k: any) => ({
        ...k,
        author_name: nameMap.get(k.author_id) ?? '알 수 없음',
        target_name: nameMap.get(k.target_id) ?? '알 수 없음',
        like_count: likeCounts.get(k.id) ?? 0,
        my_like: myLikes.has(k.id),
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

  const toggleLike = useCallback(
    async (kudosId: string, userId: string) => {
      // 낙관적 업데이트
      setKudosList((prev) =>
        prev.map((k) =>
          k.id === kudosId
            ? { ...k, my_like: !k.my_like, like_count: k.like_count + (k.my_like ? -1 : 1) }
            : k,
        ),
      );

      const { data: existing } = await supabase
        .from('kudos_likes')
        .select('kudos_id')
        .eq('kudos_id', kudosId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('kudos_likes')
          .delete()
          .eq('kudos_id', kudosId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kudos_likes')
          .insert({ kudos_id: kudosId, user_id: userId });
        if (error) throw error;
      }
    },
    [],
  );

  const fetchTeamMembers = useCallback(async (team: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('profiles').select('id, name').eq('team', team).neq('status', '퇴사').order('name'),
      8000, 'teamMembers',
    );
    if (error) throw error;
    return (data ?? []) as { id: string; name: string }[];
  }, []);

  return { kudosList, loading, error, fetchKudos, createKudos, toggleLike, fetchTeamMembers };
}
