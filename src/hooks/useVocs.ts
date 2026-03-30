import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Voc } from '../types';
import type { VocCategory, VocStatus } from '../lib/constants';

export interface VocFilters {
  category?: VocCategory | null;
  status?: VocStatus | null;
  team?: string | null;
  sort?: 'newest' | 'oldest';
}

export function useVocs() {
  const [vocs, setVocs] = useState<Voc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVocs = useCallback(async (filters: VocFilters = {}) => {
    setLoading(true);
    setError(null);

    let query = supabase.from('vocs').select('*');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.team) {
      query = query.eq('team', filters.team);
    }

    query = query.order('created_at', {
      ascending: filters.sort === 'oldest',
    });

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('VOC 조회 실패:', fetchError.message);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setVocs(data ?? []);
    setLoading(false);
  }, []);

  const createVoc = useCallback(
    async (input: {
      anonymous: boolean;
      category: VocCategory;
      title: string;
      content: string;
      team: string;
      target_area?: string | null;
      attachment_urls?: string[];
      author_id?: string | null;
    }) => {
      const sessionToken = input.anonymous ? crypto.randomUUID() : null;

      const { data, error: insertError } = await supabase
        .from('vocs')
        .insert({
          author_id: input.anonymous ? null : input.author_id,
          anonymous: input.anonymous,
          category: input.category,
          title: input.title,
          content: input.content,
          team: input.team,
          target_area: input.target_area ?? null,
          attachment_urls: input.attachment_urls ?? null,
          session_token: sessionToken,
        })
        .select()
        .single();

      if (insertError) {
        console.error('VOC 등록 실패:', insertError.message);
        return { data: null, error: insertError.message };
      }

      // 익명 VOC → localStorage에 session_token 저장
      if (input.anonymous && data && sessionToken) {
        const tokens = JSON.parse(localStorage.getItem('voc_tokens') || '{}');
        tokens[data.id] = sessionToken;
        localStorage.setItem('voc_tokens', JSON.stringify(tokens));
      }

      return { data, error: null };
    },
    []
  );

  const updateVoc = useCallback(
    async (
      id: string,
      updates: {
        status?: VocStatus;
        assignee_id?: string | null;
        resolution?: string | null;
      }
    ) => {
      const { data, error: updateError } = await supabase
        .from('vocs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('VOC 수정 실패:', updateError.message);
        return { data: null, error: updateError.message };
      }

      // 상태 변경 시 실명 작성자에게 notification
      if (updates.status && data.author_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: data.author_id,
            type: 'voc_status',
            urgency: '참고' as const,
            title: `📞 VOC 상태가 '${updates.status}'로 변경되었습니다`,
            body: data.title,
            link: `/voc/${data.id}`,
            channel: 'in_app',
          });
        } catch {
          // notification 실패해도 상태 변경은 정상 완료
        }
      }

      setVocs((prev) => prev.map((v) => (v.id === id ? data : v)));
      return { data, error: null };
    },
    []
  );

  // 세션 토큰으로 익명 작성자 여부 확인
  const isAnonymousAuthor = useCallback((vocId: string, vocSessionToken: string | null) => {
    if (!vocSessionToken) return false;
    const tokens = JSON.parse(localStorage.getItem('voc_tokens') || '{}');
    return tokens[vocId] === vocSessionToken;
  }, []);

  // 같은 팀의 리더/관리자 목록 (담당자 배정용)
  const fetchAssignees = useCallback(async (team: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, role, team')
      .in('role', ['leader', 'admin'])
      .eq('team', team);
    return data ?? [];
  }, []);

  return {
    vocs,
    loading,
    error,
    fetchVocs,
    createVoc,
    updateVoc,
    isAnonymousAuthor,
    fetchAssignees,
  };
}

// Realtime: 새 VOC 구독
export function useVocRealtime(onNewVoc: (voc: Voc) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('vocs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vocs' },
        (payload) => {
          onNewVoc(payload.new as Voc);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewVoc]);
}
